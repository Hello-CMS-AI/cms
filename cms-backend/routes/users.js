// cms-backend/routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/user'); // Import the User model
const { updateUser } = require('../controllers/userController'); // Import the update controller
const bcrypt = require('bcrypt');

/// Route to add a new user
router.post('/add-user', async (req, res) => {
  try {
    const { username, email, firstName, lastName, password, role, language, sendNotification } = req.body;

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

    const newUser = new User({
      username,
      email,
      firstName,
      lastName,
      password: hashedPassword, // Use hashed password here
      role,
      language,
      sendNotification,
    });

    await newUser.save();
    res.status(201).json({ message: 'User added successfully!' });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ error: 'Failed to add user' });
  }
});

// Route to get all users (excluding passwords)
router.get('/all-users', async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // Exclude password field
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Route to get a user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// cms-backend/routes/users.js
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully!' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});


// Route to update a user
router.put('/edit/:id', updateUser);

module.exports = router;

