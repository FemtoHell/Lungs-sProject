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
          let lastScan = 'Never';
          let status = 'Normal';
          
          try {
            // Tìm medical record gần nhất của patient này
            const lastRecord = await medicalRecordsCollection
              .findOne(
                { 
                  $or: [
                    { patient_id: patient._id },
                    { user_id: patient._id }
                  ]
                },
                { sort: { created_at: -1 } }
              );
            
            if (lastRecord) {
              lastScan = lastRecord.created_at.toISOString().split('T')[0]; // Format: YYYY-MM-DD
              
              // Xác định status dựa trên kết quả
              if (lastRecord.diagnosis || lastRecord.analysis_result) {
                const result = (lastRecord.diagnosis || lastRecord.analysis_result).toLowerCase();
                if (result.includes('abnormal') || result.includes('suspicious') || result.includes('concerning')) {
                  status = 'Abnormal';
                }
              }
            }
          } catch (recordErr) {
            console.log('Error fetching last scan for patient:', recordErr.message);
          }
          
          recentPatients.push({
            id: patient._id.toString(),
            name: patient.full_name || patient.name || patient.email?.split('@')[0] || 'Unknown',
            email: patient.email,
            age: patient.age || null, // Age field might not exist
            lastScan,
            status,
            registeredDate: patient.created_at ? patient.created_at.toISOString().split('T')[0] : 'Unknown'
          });
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

module.exports = router;