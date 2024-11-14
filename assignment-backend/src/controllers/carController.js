// src/controllers/carController.js

const Car = require('../models/Car');
const fs = require('fs').promises;
const path = require('path');

// Helper function to convert file paths to URLs
const getImageUrls = (images) => {
  return images.map(image => `${process.env.BASE_URL}/uploads/${image}`);
};

const deleteImages = async (images) => {
  for (const image of images) {
    try {
      await fs.unlink(path.join(__dirname, '../uploads', image));
    } catch (error) {
      console.error(`Error deleting image ${image}:`, error);
    }
  }
};

const createCar = async (req, res) => {
  try {
    const { title, description, tags } = req.body;
    const images = req.files ? req.files.map(file => file.filename) : [];

    const car = new Car({
      userId: req.user._id,
      title,
      description,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      images,
    });

    await car.save();

    res.status(201).json({
      ...car.toObject(),
      imageUrls: getImageUrls(images),
    });
  } catch (error) {
    // Clean up uploaded files if save fails
    if (req.files) {
      await deleteImages(req.files.map(file => file.filename));
    }
    res.status(400).json({ error: error.message });
  }
};


const getCars = async (req, res) => {
  try {
    const { search } = req.query;
    const query = { userId: req.user._id };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    const cars = await Car.find(query).sort({ createdAt: -1 });
    
    res.json(
      cars.map(car => ({
        ...car.toObject(),
        images: getImageUrls(car.images),
      }))
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCarById = async (req, res) => {
  try {
    const car = await Car.findOne({ _id: req.params.id, userId: req.user._id });
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    
    res.json({
      ...car.toObject(),
      images: getImageUrls(car.images),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateCar = async (req, res) => {
  try {
    const { title, description, tags } = req.body;
    const updates = {
      title,
      description,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      updatedAt: Date.now()
    };

    const oldCar = await Car.findOne({ _id: req.params.id, userId: req.user._id });
    if (!oldCar) {
      return res.status(404).json({ error: 'Car not found' });
    }

    if (req.files && req.files.length > 0) {
      // Delete old images
      await deleteImages(oldCar.images);
      updates.images = req.files.map(file => file.filename);
    }

    const car = await Car.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updates,
      { new: true }
    );

    res.json({
      ...car.toObject(),
      imageUrls: getImageUrls(car.images),
    });
  } catch (error) {
    // Clean up uploaded files if update fails
    if (req.files) {
      await deleteImages(req.files.map(file => file.filename));
    }
    res.status(400).json({ error: error.message });
  }
};

const deleteCar = async (req, res) => {
  try {
    const car = await Car.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    // Delete associated images
    await deleteImages(car.images);
    
    res.json(car);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createCar, getCars, getCarById, updateCar, deleteCar };
