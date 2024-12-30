import express from "express";
import User from "../models/User";
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

function createResponse(statusCode, statusText, data = null) {
  return {
    statusCode,
    statusText,
    data,
  };
}

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  const roleUser = email === "admin@gmail.com" ? "admin" : "keeper";

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json(
          createResponse(409, "Email already exists. Please use another email.")
        );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: roleUser,
    });

    const savedUser = await newUser.save();

    return res.status(200).json(
      createResponse(200, "User registered successfully", {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
      })
    );
  } catch (error) {
    return res.status(500).json(createResponse(500, { error }));
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json(createResponse(401, "Invalid email or password."));
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json(createResponse(401, "Invalid email or password."));
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "30s",
      }
    );

    const refreshToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );
    return res.status(200).json(
      createResponse(200, "Login successful", {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token,
          refreshToken,
        },
      })
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json(createResponse(500, "Internal server error."));
  }
});

router.post("/refresh-token", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res
      .status(400)
      .json(createResponse(400, "Refresh token is required."));
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json(createResponse(404, "User not found."));
    }

    const newToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    );

    const newRefreshToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json(
      createResponse(200, "Token refreshed successfully", {
        token: newToken,
        refreshToken: newRefreshToken,
      })
    );
  } catch (error) {
    console.error("Error verifying refresh token:", error);
    return res
      .status(401)
      .json(createResponse(401, "Invalid or expired refresh token."));
  }
});

export default router;
