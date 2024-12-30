const User = require("./models/User");

const initializeAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: "admin" });
    if (!adminExists) {
      console.log("No admin found. Creating default admin...");
      const adminUser = new User({
        name: "Admin",
        email: "admin@gmail.com",
        password: "123456",
        role: "admin",
      });
      await adminUser.save();
      console.log("Admin created successfully with email: admin@gmail.com and password: 123456");
    } else {
      console.log("Admin already exists. No need to create a new one.");
    }
  } catch (error) {
    console.error("Error initializing admin:", error);
  }
};

module.exports = initializeAdmin;
