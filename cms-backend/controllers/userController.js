// controllers/userController.js
const User = require('../models/user'); // Import your user model
const bcrypt = require('bcrypt');

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, firstName, lastName, role, language, password } = req.body;

  try {
    let updatedData = { username, email, firstName, lastName, role, language };

    // Hash the password if it exists
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updatedData.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(id, updatedData, { new: true, runValidators: true });
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User updated successfully', updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user', error });
  }
};

// Controller to create a new user
const createUser = async (req, res) => {
  const { username, email, password, firstName, lastName, role, language } = req.body;

  try {
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

    // Create the user with the hashed password
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      language,
    });

    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user', error });
  }
};

module.exports = { updateUser, createUser };
