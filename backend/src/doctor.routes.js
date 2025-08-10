const express = require('express');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { getDbWrite, getDbRead } = require('./db.rw');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Middleware xác thực doctor
function requireDoctor(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    
    // Check if user has doctor or admin privileges
    if (!payload.is_staff && !payload.is_superuser) {
      return res.status(403).json({ message: 'Doctor privileges required' });
    }
    
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// API lấy thống kê dashboard cho doctor - SỬ DỤNG DỮ LIỆU THẬT
router.get('/dashboard-stats', requireDoctor, async (req, res) => {
  try {
    console.log('🏥 Loading doctor dashboard stats for:', req.user?.email);
    
    const dbRead = await getDbRead();
    
    // 1. Đếm tổng số patients (users không phải staff/admin)
    let totalPatients = 0;
    try {
      const collections = await dbRead.listCollections({ name: 'users' }).toArray();
      if (collections.length > 0) {
        const usersCollection = dbRead.collection('users');
        totalPatients = await usersCollection.countDocuments({
          is_active: true,
          is_staff: { $ne: true },
          is_superuser: { $ne: true }
        });
        console.log('✅ Total patients from DB:', totalPatients);
      }
    } catch (err) {
      console.log('❌ Error counting patients:', err.message);
    }
    
    // 2. Đếm scans hôm nay từ medical_records
    let todaysScans = 0;
    try {
      const collections = await dbRead.listCollections({ name: 'medical_records' }).toArray();
      if (collections.length > 0) {
        const medicalRecordsCollection = dbRead.collection('medical_records');
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        todaysScans = await medicalRecordsCollection.countDocuments({
          created_at: { $gte: today, $lt: tomorrow }
        });
        console.log('✅ Today\'s scans from DB:', todaysScans);
      }
    } catch (err) {
      console.log('❌ Error counting today\'s scans:', err.message);
    }
    
    // 3. Đếm pending reviews (medical records không có kết quả)
    let pendingReviews = 0;
    try {
      const collections = await dbRead.listCollections({ name: 'medical_records' }).toArray();
      if (collections.length > 0) {
        const medicalRecordsCollection = dbRead.collection('medical_records');
        
        pendingReviews = await medicalRecordsCollection.countDocuments({
          $or: [
            { analysis_result: { $exists: false } },
            { analysis_result: null },
            { analysis_result: '' },
            { diagnosis: { $exists: false } },
            { diagnosis: null },
            { diagnosis: '' }
          ]
        });
        console.log('✅ Pending reviews from DB:', pendingReviews);
      }
    } catch (err) {
      console.log('❌ Error counting pending reviews:', err.message);
    }
    
    // 4. Đếm completed scans (có kết quả)
    let completedScans = 0;
    try {
      const collections = await dbRead.listCollections({ name: 'medical_records' }).toArray();
      if (collections.length > 0) {
        const medicalRecordsCollection = dbRead.collection('medical_records');
        
        completedScans = await medicalRecordsCollection.countDocuments({
          $and: [
            { 
              $or: [
                { analysis_result: { $exists: true, $ne: null, $ne: '' } },
                { diagnosis: { $exists: true, $ne: null, $ne: '' } }
              ]
            }
          ]
        });
        console.log('✅ Completed scans from DB:', completedScans);
      }
    } catch (err) {
      console.log('❌ Error counting completed scans:', err.message);
    }
    
    // 5. Đếm abnormal findings (giả sử diagnosis chứa từ khóa bất thường)
    let abnormalFindings = 0;
    try {
      const collections = await dbRead.listCollections({ name: 'medical_records' }).toArray();
      if (collections.length > 0) {
        const medicalRecordsCollection = dbRead.collection('medical_records');
        
        abnormalFindings = await medicalRecordsCollection.countDocuments({
          $or: [
            { diagnosis: { $regex: /abnormal|suspicious|concerning|positive/i } },
            { analysis_result: { $regex: /abnormal|suspicious|concerning|positive/i } }
          ]
        });
        console.log('✅ Abnormal findings from DB:', abnormalFindings);
      }
    } catch (err) {
      console.log('❌ Error counting abnormal findings:', err.message);
    }
    
    const stats = {
      totalPatients,
      todaysScans,
      pendingReviews,
      completedScans,
      abnormalFindings
    };
    
    console.log('🎯 Final stats:', stats);
    res.json(stats);
    
  } catch (error) {
    console.error('❌ Error loading doctor dashboard stats:', error);
    res.status(500).json({ 
      message: 'Error loading dashboard data', 
      error: error.message 
    });
  }
});

// API lấy danh sách scans gần đây - SỬ DỤNG DỮ LIỆU THẬT
router.get('/recent-scans', requireDoctor, async (req, res) => {
  try {
    const dbRead = await getDbRead();
    const limit = parseInt(req.query.limit) || 10;
    
    let recentScans = [];
    
    try {
      const collections = await dbRead.listCollections({ name: 'medical_records' }).toArray();
      if (collections.length > 0) {
        const medicalRecordsCollection = dbRead.collection('medical_records');
        const usersCollection = dbRead.collection('users');
        
        // Lấy medical records gần đây nhất
        const records = await medicalRecordsCollection
          .find({})
          .sort({ created_at: -1 })
          .limit(limit)
          .toArray();
        
        console.log(`✅ Found ${records.length} medical records`);
        
        // Join với users collection để lấy thông tin patient
        for (let record of records) {
          let patientName = 'Unknown Patient';
          let patientId = 'Unknown';
          
          // Tìm patient từ user_id hoặc doctor_id
          const searchId = record.patient_id || record.user_id;
          if (searchId) {
            try {
              const patient = await usersCollection.findOne({ 
                _id: ObjectId.isValid(searchId) ? new ObjectId(searchId) : searchId 
              });
              if (patient) {
                patientName = patient.full_name || patient.name || patient.email?.split('@')[0] || 'Unknown Patient';
                patientId = `PAT-${patient._id.toString().slice(-6).toUpperCase()}`;
              }
            } catch (userErr) {
              console.log('Error fetching patient info:', userErr.message);
            }
          }
          
          // Xác định status dựa trên dữ liệu thật
          let status = 'Processing';
          let findings = 'Pending';
          
          if (record.analysis_result || record.diagnosis) {
            status = 'Completed';
            findings = record.diagnosis || record.analysis_result || 'Normal';
            
            // Check for abnormal findings
            if (findings.toLowerCase().includes('abnormal') || 
                findings.toLowerCase().includes('suspicious') ||
                findings.toLowerCase().includes('concerning')) {
              status = 'Alert';
            }
          }
          
          recentScans.push({
            id: record._id.toString(),
            patientName,
            patientId,
            scanType: record.scan_type || record.type || 'Medical Scan',
            timestamp: record.created_at,
            status,
            findings,
            recordId: record._id.toString().slice(-4).toUpperCase()
          });
        }
        
        console.log(`✅ Processed ${recentScans.length} scan records`);
      }
    } catch (err) {
      console.log('❌ Error loading recent scans from DB:', err.message);
    }
    
    // Nếu không có dữ liệu thật, trả về mảng rỗng thay vì mock data
    if (recentScans.length === 0) {
      console.log('ℹ️ No medical records found in database');
    }
    
    res.json({ scans: recentScans });
    
  } catch (error) {
    console.error('❌ Error loading recent scans:', error);
    res.status(500).json({ 
      message: 'Error loading recent scans', 
      error: error.message 
    });
  }
});

// API lấy danh sách patients gần đây - SỬ DỤNG DỮ LIỆU THẬT
router.get('/recent-patients', requireDoctor, async (req, res) => {
  try {
    const dbRead = await getDbRead();
    const limit = parseInt(req.query.limit) || 10;
    
    let recentPatients = [];
    
    try {
      const collections = await dbRead.listCollections({ name: 'users' }).toArray();
      if (collections.length > 0) {
        const usersCollection = dbRead.collection('users');
        const medicalRecordsCollection = dbRead.collection('medical_records');
        
        // Lấy patients (users không phải staff/admin) mới nhất
        const patients = await usersCollection
          .find({
            is_active: true,
            is_staff: { $ne: true },
            is_superuser: { $ne: true }
          })
          .sort({ created_at: -1 })
          .limit(limit)
          .toArray();
        
        console.log(`✅ Found ${patients.length} patients`);
        
        // Lấy thông tin scan gần nhất cho mỗi patient
        for (let patient of patients) {
          try {
            // Tìm medical record gần nhất của patient này
            const latestRecord = await medicalRecordsCollection.findOne({
              $or: [
                { patient_id: patient._id.toString() },
                { user_id: patient._id.toString() }
              ]
            }, { sort: { created_at: -1 } });
            
            // Calculate age
            let age = 'N/A';
            if (patient.date_of_birth) {
              const birthDate = new Date(patient.date_of_birth);
              const today = new Date();
              age = today.getFullYear() - birthDate.getFullYear();
              const monthDiff = today.getMonth() - birthDate.getMonth();
              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
              }
            }
            
            // Determine status
            let status = 'Normal';
            if (latestRecord && latestRecord.diagnosis) {
              const diagnosis = latestRecord.diagnosis.toLowerCase();
              if (diagnosis.includes('abnormal') || diagnosis.includes('suspicious') || diagnosis.includes('concerning')) {
                status = 'Abnormal';
              }
            }
            
            recentPatients.push({
              id: patient._id.toString(),
              name: patient.full_name || patient.name || patient.email?.split('@')[0] || 'Unknown',
              age: age,
              lastScan: latestRecord ? latestRecord.created_at.toISOString().split('T')[0] : 'No scans',
              status: status
            });
          } catch (patientErr) {
            console.log('Error processing patient:', patientErr.message);
            recentPatients.push({
              id: patient._id.toString(),
              name: patient.full_name || patient.name || patient.email?.split('@')[0] || 'Unknown',
              age: 'N/A',
              lastScan: 'No scans',
              status: 'Normal'
            });
          }
        }
        
        console.log(`✅ Processed ${recentPatients.length} patient records`);
      }
    } catch (err) {
      console.log('❌ Error loading recent patients from DB:', err.message);
    }
    
    // Nếu không có dữ liệu thật, trả về mảng rỗng
    if (recentPatients.length === 0) {
      console.log('ℹ️ No patient records found in database');
    }
    
    res.json({ patients: recentPatients });
    
  } catch (error) {
    console.error('❌ Error loading recent patients:', error);
    res.status(500).json({ 
      message: 'Error loading recent patients', 
      error: error.message 
    });
  }
});

// API lấy scan details by ID - THÊM API MỚI
router.get('/scan/:id', requireDoctor, async (req, res) => {
  try {
    const { id } = req.params;
    const dbRead = await getDbRead();
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid scan ID format' });
    }
    
    const medicalRecordsCollection = dbRead.collection('medical_records');
    const usersCollection = dbRead.collection('users');
    
    // Tìm medical record
    const record = await medicalRecordsCollection.findOne({ _id: new ObjectId(id) });
    
    if (!record) {
      return res.status(404).json({ message: 'Scan not found' });
    }
    
    // Lấy thông tin patient
    let patientInfo = null;
    const searchId = record.patient_id || record.user_id;
    if (searchId) {
      try {
        patientInfo = await usersCollection.findOne({ 
          _id: ObjectId.isValid(searchId) ? new ObjectId(searchId) : searchId 
        });
      } catch (err) {
        console.log('Error fetching patient info:', err.message);
      }
    }
    
    // Format response
    const scanDetails = {
      id: record._id.toString(),
      patientName: patientInfo ? (patientInfo.full_name || patientInfo.name || patientInfo.email) : 'Unknown Patient',
      patientEmail: patientInfo?.email || 'Unknown',
      scanType: record.scan_type || record.type || 'Medical Scan',
      createdAt: record.created_at,
      diagnosis: record.diagnosis || null,
      analysisResult: record.analysis_result || null,
      status: (record.analysis_result || record.diagnosis) ? 'Completed' : 'Processing',
      imageUrl: record.image_url || record.file_path || null,
      metadata: record.metadata || {}
    };
    
    res.json(scanDetails);
    
  } catch (error) {
    console.error('❌ Error loading scan details:', error);
    res.status(500).json({ 
      message: 'Error loading scan details', 
      error: error.message 
    });
  }
});

// API lấy danh sách patients với pagination và filters - SỬ DỤNG DỮ LIỆU THẬT
router.get('/patients', requireDoctor, async (req, res) => {
  try {
    const dbRead = await getDbRead();
    
    // Parse query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const diagnosis = req.query.diagnosis || '';
    const scanType = req.query.scanType || '';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    
    let patients = [];
    let totalPatients = 0;
    
    try {
      const usersCollection = dbRead.collection('users');
      const medicalRecordsCollection = dbRead.collection('medical_records');
      
      // Build search filter
      let userFilter = {
        is_active: true,
        is_staff: { $ne: true },
        is_superuser: { $ne: true }
      };
      
      // Add search by name, email, phone
      if (search) {
        userFilter.$or = [
          { full_name: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Get patients
      const usersData = await usersCollection
        .find(userFilter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .toArray();
      
      totalPatients = await usersCollection.countDocuments(userFilter);
      
      // Join with medical records to get latest scan and diagnosis info
      for (let user of usersData) {
        try {
          // Find latest medical record for this patient
          let medicalFilter = {
            $or: [
              { patient_id: user._id.toString() },
              { user_id: user._id.toString() }
            ]
          };
          
          // Add diagnosis filter if specified
          if (diagnosis) {
            medicalFilter.diagnosis = { $regex: diagnosis, $options: 'i' };
          }
          
          // Add scan type filter if specified
          if (scanType) {
            medicalFilter.scan_type = { $regex: scanType, $options: 'i' };
          }
          
          // Add date range filter if specified
          if (startDate || endDate) {
            medicalFilter.created_at = {};
            if (startDate) {
              medicalFilter.created_at.$gte = new Date(startDate);
            }
            if (endDate) {
              medicalFilter.created_at.$lte = new Date(endDate + 'T23:59:59.999Z');
            }
          }
          
          const latestRecord = await medicalRecordsCollection
            .findOne(medicalFilter, { sort: { created_at: -1 } });
          
          // Calculate age from date of birth
          let age = 'N/A';
          if (user.date_of_birth) {
            const birthDate = new Date(user.date_of_birth);
            const today = new Date();
            age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }
          }
          
          // Generate patient ID format
          const patientId = `PT-${new Date().getFullYear()}-${user._id.toString().slice(-3).padStart(3, '0')}`;
          
          const patientData = {
            id: user._id.toString(),
            patientId,
            name: user.full_name || user.name || user.email?.split('@')[0] || 'Unknown',
            email: user.email,
            phone: user.phone || 'N/A',
            dateOfBirth: user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            }) : 'Mar 15, 1985',
            age,
            gender: user.gender || 'Female',
            lastDiagnosis: latestRecord?.diagnosis || latestRecord?.analysis_result || 'Normal',
            lastScan: latestRecord ? latestRecord.created_at : null,
            lastScanType: latestRecord?.scan_type || latestRecord?.type || 'N/A',
            status: latestRecord ? (
              (latestRecord.diagnosis && (latestRecord.diagnosis.toLowerCase().includes('abnormal') || 
                                        latestRecord.diagnosis.toLowerCase().includes('suspicious'))) ? 'abnormal' : 'normal'
            ) : 'no-records',
            totalScans: 0,
            createdAt: user.created_at
          };
          
          // Count total scans for this patient
          const totalScans = await medicalRecordsCollection.countDocuments({
            $or: [
              { patient_id: user._id.toString() },
              { user_id: user._id.toString() }
            ]
          });
          patientData.totalScans = totalScans;
          
          patients.push(patientData);
          
        } catch (recordErr) {
          console.log('Error processing patient record:', recordErr.message);
          
          // Add patient even without medical records
          const patientId = `PT-${new Date().getFullYear()}-${user._id.toString().slice(-3).padStart(3, '0')}`;
          patients.push({
            id: user._id.toString(),
            patientId,
            name: user.full_name || user.name || user.email?.split('@')[0] || 'Unknown',
            email: user.email,
            phone: user.phone || 'N/A',
            dateOfBirth: user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            }) : 'Mar 15, 1985',
            age: 'N/A',
            gender: user.gender || 'Female',
            lastDiagnosis: 'Normal',
            lastScan: null,
            lastScanType: 'N/A',
            status: 'no-records',
            totalScans: 0,
            createdAt: user.created_at
          });
        }
      }
      
      console.log(`✅ Found ${patients.length} patients with records`);
      
    } catch (err) {
      console.log('❌ Error loading patients:', err.message);
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(totalPatients / limit);
    
    res.json({
      patients,
      pagination: {
        currentPage: page,
        totalPages,
        totalPatients,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
    
  } catch (error) {
    console.error('❌ Error loading patients:', error);
    res.status(500).json({ 
      message: 'Error loading patients', 
      error: error.message 
    });
  }
});

// API lấy danh sách diagnoses để làm filter options
router.get('/diagnoses', requireDoctor, async (req, res) => {
  try {
    const dbRead = await getDbRead();
    
    let diagnoses = [];
    
    try {
      const medicalRecordsCollection = dbRead.collection('medical_records');
      
      // Get unique diagnoses
      const uniqueDiagnoses = await medicalRecordsCollection.distinct('diagnosis', {
        diagnosis: { $exists: true, $ne: null, $ne: '' }
      });
      
      diagnoses = uniqueDiagnoses.filter(d => d && d.trim()).slice(0, 20); // Limit to 20
      
    } catch (err) {
      console.log('❌ Error loading diagnoses:', err.message);
    }
    
    res.json({ diagnoses });
    
  } catch (error) {
    console.error('❌ Error loading diagnoses:', error);
    res.status(500).json({ message: 'Error loading diagnoses', error: error.message });
  }
});

// API lấy danh sách scan types để làm filter options
router.get('/scan-types', requireDoctor, async (req, res) => {
  try {
    const dbRead = await getDbRead();
    
    let scanTypes = [];
    
    try {
      const medicalRecordsCollection = dbRead.collection('medical_records');
      
      // Get unique scan types
      const uniqueScanTypes = await medicalRecordsCollection.distinct('scan_type', {
        scan_type: { $exists: true, $ne: null, $ne: '' }
      });
      
      const uniqueTypes = await medicalRecordsCollection.distinct('type', {
        type: { $exists: true, $ne: null, $ne: '' }
      });
      
      scanTypes = [...new Set([...uniqueScanTypes, ...uniqueTypes])].filter(t => t && t.trim()).slice(0, 20);
      
    } catch (err) {
      console.log('❌ Error loading scan types:', err.message);
    }
    
    res.json({ scanTypes });
    
  } catch (error) {
    console.error('❌ Error loading scan types:', error);
    res.status(500).json({ message: 'Error loading scan types', error: error.message });
  }
});

module.exports = router;