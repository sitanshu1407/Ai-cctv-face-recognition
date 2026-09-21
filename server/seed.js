const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");

// Load env vars
dotenv.config();

const seedDatabase = async () => {
  try {
    console.log("Connecting to database for seeding...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected for seeding.");

    // Check if admin user exists
    const adminExists = await User.findOne({ role: "admin" });
    
    if (adminExists) {
      console.log("Admin user already exists. No seeding needed.");
      process.exit(0);
    }

    // Create default admin user
    await User.create({
      username: "admin",
      email: "admin@security.local",
      password: "password123",
      role: "admin",
    });

    console.log("Seeding complete: Created admin user successfully.");
    console.log("Credentials:");
    console.log("  Username: admin");
    console.log("  Password: password123");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exit(1);
  }
};

seedDatabase();
