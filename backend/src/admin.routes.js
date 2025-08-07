const express = require('express');
const { requireAdmin } = require('./auth.admin.middleware');
const router = express.Router();

const { ObjectId } = require('mongodb');
const { getDbWrite, getDbRead } = require('./db.rw');
 
router.get('/', requireAdmin, (req, res) => {
  res.json({ message: 'Bạn có quyền truy cập trang admin!', user: req.user });
});

// API lấy dashboard stats từ database thật
router.get('/dashboard-stats', requireAdmin, async (req, res) => {
  try {
    const dbRead = await getDbRead();
    
    // Đếm tổng số scans (giả sử có collection scans hoặc medical_records)
    let totalScans = 0;
    try {
      const medicalRecordsCollection = dbRead.collection('medical_records');
      totalScans = await medicalRecordsCollection.countDocuments();
    } catch (err) {
      console.log('medical_records collection not found, using default value');
      totalScans = 1250; // Default value if no collection
    }
    
    // Đếm số doctors active (staff users) - Handle empty collection
    let activeDoctors = 0;
    let totalUsers = 0;
    
    try {
      const usersCollection = dbRead.collection('users');
      
      // Check if collection exists
      const collections = await dbRead.listCollections({ name: 'users' }).toArray();
      
      if (collections.length > 0) {
        activeDoctors = await usersCollection.countDocuments({ 
          is_active: true,
          is_staff: true
        });
        
        // Đếm tổng số users (bao gồm cả bệnh nhân)
        totalUsers = await usersCollection.countDocuments();
      }
    } catch (err) {
      console.log('users collection error:', err.message);
      activeDoctors = 0;
      totalUsers = 0;
    }
    
    // Tính abnormal rate (mock data vì chưa có dữ liệu thật)
    const abnormalRate = 23;
    
    // System uptime (mock data)
    const systemUptime = 99.98;
    
    res.json({
      totalScans,
      activeDoctors,
      totalUsers,
      abnormalRate,
      systemUptime
    });
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
    res.status(500).json({ message: 'Error loading dashboard stats', error: error.message });
  }
});

// API lấy danh sách users với phân quyền - FIXED VERSION
router.get('/users', requireAdmin, async (req, res) => {
  try {
    console.log('🔍 Loading users request from:', req.user?.email);
    
    const dbRead = await getDbRead();
    console.log('✅ Database connection established');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter query
    const filter = {};
    if (req.query.status === 'Active') filter.is_active = true;
    if (req.query.status === 'Suspended') filter.is_active = false;
    
    // Role filter
    if (req.query.role === 'Administrator') filter.is_superuser = true;
    if (req.query.role === 'Doctor' || req.query.role === 'Staff') filter.is_staff = true;
    if (req.query.role === 'Patient') {
      filter.is_superuser = { $ne: true };
      filter.is_staff = { $ne: true };
    }
    
    console.log('🔍 Filter query:', filter);
    
    // Check if users collection exists
    let collections;
    try {
      collections = await dbRead.listCollections({ name: 'users' }).toArray();
      console.log('📊 Collections found:', collections.length);
    } catch (collectionsError) {
      console.log('❌ Error checking collections:', collectionsError.message);
      collections = [];
    }
    
    if (collections.length === 0) {
      console.log('📝 Users collection does not exist - returning empty result');
      return res.json({
        users: [],
        currentPage: page,
        totalPages: 1,
        totalUsers: 0,
        message: 'No users found - collection does not exist yet'
      });
    }
    
    const users = dbRead.collection('users');
    
    // Get users with pagination - with error handling
    let userList = [];
    let totalUsers = 0;
    
    try {
      userList = await users.find(filter)
        .project({ password: 0 }) // Exclude password
        .skip(skip)
        .limit(limit)
        .sort({ created_at: -1 })
        .toArray();
      
      console.log('👥 Users found:', userList.length);
      
      // Get total count for pagination
      totalUsers = await users.countDocuments(filter);
      console.log('📊 Total users in DB:', totalUsers);
      
    } catch (queryError) {
      console.log('❌ Database query error:', queryError.message);
      
      // Handle specific MongoDB errors
      if (queryError.message.includes('ns not found') || 
          queryError.message.includes('Collection') ||
          queryError.code === 26) {
        // Collection doesn't exist or namespace not found
        return res.json({
          users: [],
          currentPage: page,
          totalPages: 1,
          totalUsers: 0,
          message: 'No users found - collection is empty'
        });
      }
      
      // Re-throw other errors
      throw queryError;
    }
    
    const totalPages = Math.max(Math.ceil(totalUsers / limit), 1);
    
    console.log('✅ Returning users:', {
      count: userList.length,
      totalUsers,
      totalPages,
      currentPage: page
    });
    
    res.json({
      users: userList,
      currentPage: page,
      totalPages,
      totalUsers
    });
    
  } catch (error) {
    console.error('❌ Error loading users:', error);
    res.status(500).json({ 
      message: 'Error loading users', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// API cập nhật status user
router.patch('/users/:userId/status', requireAdmin, async (req, res) => {
  try {
    const dbWrite = await getDbWrite();
    const users = dbWrite.collection('users');
    const { userId } = req.params;
    const { is_active } = req.body;
    
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          is_active, 
          updated_at: new Date() 
        } 
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Error updating user status', error: error.message });
  }
});

// API xóa user
router.delete('/users/:userId', requireAdmin, async (req, res) => {
  try {
    const dbWrite = await getDbWrite();
    const users = dbWrite.collection('users');
    const { userId } = req.params;
    
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    // Không cho phép xóa superuser
    const user = await users.findOne({ _id: new ObjectId(userId) });
    if (user && user.is_superuser) {
      return res.status(403).json({ message: 'Cannot delete superuser' });
    }
    
    const result = await users.deleteOne({ _id: new ObjectId(userId) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

// API tạo user mới
router.post('/users', requireAdmin, async (req, res) => {
  const { email, password, role, full_name } = req.body;
  
  if (!email || !password || !role) {
    return res.status(400).json({ message: 'Email, password and role are required' });
  }
  
  try {
    const dbRead = await getDbRead();
    const dbWrite = await getDbWrite();
    const users = dbWrite.collection('users');
    
    // Check if user already exists - handle collection not existing
    let existingUser = null;
    try {
      existingUser = await dbRead.collection('users').findOne({ email });
    } catch (err) {
      console.log('Users collection does not exist yet, proceeding with user creation');
    }
    
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }
    
    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Determine user permissions based on role
    const newUser = {
      email,
      password: hashedPassword,
      full_name: full_name || email.split('@')[0],
      is_active: true,
      is_superuser: role === 'Administrator',
      is_staff: role === 'Doctor' || role === 'Staff' || role === 'Administrator',
      roles: [],
      extra_permissions: [],
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const result = await users.insertOne(newUser);
    
    res.status(201).json({ 
      message: 'User created successfully', 
      userId: result.insertedId 
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// API cập nhật thông tin user
router.patch('/users/:userId', requireAdmin, async (req, res) => {
  try {
    const dbWrite = await getDbWrite();
    const users = dbWrite.collection('users');
    const { userId } = req.params;
    const { full_name, role } = req.body;
    
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    const updateData = {
      updated_at: new Date()
    };
    
    if (full_name) updateData.full_name = full_name;
    
    if (role) {
      updateData.is_superuser = role === 'Administrator';
      updateData.is_staff = role === 'Doctor' || role === 'Staff' || role === 'Administrator';
    }
    
    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});
 
router.post('/permissions', requireAdmin, async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Permission name is required' });
  try {
    // Kiểm tra permission tồn tại (đọc)
    const dbRead = await getDbRead();
    
    let existing = null;
    try {
      const permissionsRead = dbRead.collection('permissions');
      existing = await permissionsRead.findOne({ name });
    } catch (err) {
      console.log('permissions collection does not exist yet');
    }
    
    if (existing) return res.status(409).json({ message: 'Permission already exists' });
    
    // Tạo permission mới (ghi)
    const dbWrite = await getDbWrite();
    const permissions = dbWrite.collection('permissions');
    const result = await permissions.insertOne({ name, description: description || '', created_at: new Date() });
    res.status(201).json({ message: 'Permission created', id: result.insertedId });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
 
router.post('/roles', requireAdmin, async (req, res) => {
  const { name, description, permissions } = req.body;
  if (!name) return res.status(400).json({ message: 'Role name is required' });
  try {
    // Kiểm tra role tồn tại (đọc)
    const dbRead = await getDbRead();
    
    let existing = null;
    try {
      const rolesRead = dbRead.collection('roles');
      existing = await rolesRead.findOne({ name });
    } catch (err) {
      console.log('roles collection does not exist yet');
    }
    
    if (existing) return res.status(409).json({ message: 'Role already exists' }); 
    
    // Tạo role mới (ghi)
    const dbWrite = await getDbWrite();
    const roles = dbWrite.collection('roles');
    const role = {
      name,
      description: description || '',
      permissions: Array.isArray(permissions) ? permissions : [],
      created_at: new Date()
    };
    const result = await roles.insertOne(role);
    res.status(201).json({ message: 'Role created', id: result.insertedId });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.patch('/users/permissions', requireAdmin, async (req, res) => {
  const { userIds, permissions } = req.body;
  if (!Array.isArray(userIds) || !Array.isArray(permissions)) {
    return res.status(400).json({ message: 'userIds và permissions phải là mảng' });
  }
  try {
    // Cập nhật permissions cho users (thao tác ghi)
    const dbWrite = await getDbWrite();
    const users = dbWrite.collection('users');
    const objectIds = userIds.map(id => {
      if (!ObjectId.isValid(id)) {
        throw new Error(`Invalid user ID: ${id}`);
      }
      return new ObjectId(id);
    }); 
    const permissionIds = permissions.map(id => {
      if (!ObjectId.isValid(id)) {
        throw new Error(`Invalid permission ID: ${id}`);
      }
      return new ObjectId(id);
    });
    const result = await users.updateMany(
      { _id: { $in: objectIds } },
      { $set: { extra_permissions: permissionIds, updated_at: new Date() } }
    );
    res.json({ message: 'Cập nhật quyền thành công', modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.patch('/users/roles', requireAdmin, async (req, res) => {
  const { userIds, roles } = req.body;
  if (!Array.isArray(userIds) || !Array.isArray(roles)) {
    return res.status(400).json({ message: 'userIds và roles phải là mảng' });
  }
  try {
    // Cập nhật roles cho users (thao tác ghi)
    const dbWrite = await getDbWrite();
    const users = dbWrite.collection('users');
    const objectIds = userIds.map(id => {
      if (!ObjectId.isValid(id)) {
        throw new Error(`Invalid user ID: ${id}`);
      }
      return new ObjectId(id);
    }); 
    const roleIds = roles.map(id => {
      if (!ObjectId.isValid(id)) {
        throw new Error(`Invalid role ID: ${id}`);
      }
      return new ObjectId(id);
    });
    const result = await users.updateMany(
      { _id: { $in: objectIds } },
      { $set: { roles: roleIds, updated_at: new Date() } }
    );
    res.json({ message: 'Cập nhật roles thành công', modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;