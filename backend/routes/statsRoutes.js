const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Department = require('../models/Department');

// Get all stats
router.get('/all', async (req, res) => {
    try {
        console.log('📊 Fetching university stats...');

        // Count students
        const students = await User.countDocuments({ role: 'student' });

        // Count faculty/teachers
        const faculty = await User.countDocuments({ role: 'teacher' });

        // Count departments (or programs)
        let programs = 0;
        try {
            programs = await Department.countDocuments();
        } catch (error) {
            console.log('Department model not found, using 0');
            programs = 0;
        }

        const stats = {
            students,
            faculty,
            programs
        };

        console.log('✅ Stats fetched:', stats);
        res.json(stats);
    } catch (error) {
        console.error('❌ Error fetching stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get students count only
router.get('/students', async (req, res) => {
    try {
        const count = await User.countDocuments({ role: 'student' });
        res.json({ total: count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get faculty count only
router.get('/faculty', async (req, res) => {
    try {
        const count = await User.countDocuments({ role: 'teacher' });
        res.json({ total: count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get programs count only
router.get('/programs', async (req, res) => {
    try {
        const count = await Department.countDocuments();
        res.json({ total: count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;