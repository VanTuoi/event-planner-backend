import express from "express";
import mongoose from "mongoose";
import { Event } from "../models/Event";
import User from "../models/User";
const jwt = require("jsonwebtoken");

const router = express.Router();

function createResponse(statusCode, statusText, data = null) {
  return {
    statusCode,
    statusText,
    data,
  };
}

const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json(
        createResponse(401, "Unauthorized", { message: "No token provided" })
      );
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json(
        createResponse(401, "Unauthorized", {
          message: "Invalid or expired token",
        })
      );
    }
    req.user = decoded;
    next();
  });
};

const checkRole = (roles = []) => {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json(
        createResponse(403, "Forbidden", {
          message: "You don't have permission to perform this action",
        })
      );
    }

    next();
  };
};

router.post(
  "/create",
  authenticateToken,
  checkRole(["admin"]),
  async (req, res) => {
    const { titleEvent, venue, maxParticipants, alertPoint, numberOfEntries } =
      req.body;

    try {
      const entries = Array.from(
        { length: Number(numberOfEntries) || 0 },
        (_, index) => ({
          id: new mongoose.Types.ObjectId(),
          name: `Entry #${index + 1}`,
          totalIn: 0,
          totalOut: 0,
          status: "open",
          doorKeepers: [],
        })
      );

      const newEvent = new Event({
        titleEvent: titleEvent || "",
        venue: venue || "",
        maxParticipants: Number(maxParticipants) || 0,
        alertPoint: Number(alertPoint) || 0,
        startTime: "",
        endTime: "",
        description: "",
        status: "scheduled",
        entries: entries,
        notifications: [],
      });

      await newEvent.save();

      const events = await Event.find().lean();
      const modifiedEvents = events.map((event) => ({
        ...event,
        id: event._id,
        _id: undefined,
      }));

      return res.status(200).json(
        createResponse(200, "Event created successfully", {
          events: modifiedEvents,
        })
      );
    } catch (error) {
      console.error("Error creating event:", error);
      return res
        .status(500)
        .json(
          createResponse(500, "Internal Server Error", { error: error.message })
        );
    }
  }
);

router.put(
  "/update/:id",
  authenticateToken,
  checkRole(["admin"]),
  async (req, res) => {
    const { titleEvent, venue, maxParticipants, alertPoint, numberOfEntries } =
      req.body;
    const { id } = req.params;

    try {
      const existingEvent = await Event.findById(id);
      if (!existingEvent) {
        return res.status(404).json(createResponse(404, "Event not found"));
      }

      const newNumberOfEntries = Number(numberOfEntries) || 0;
      const currentEntries = existingEvent.entries || [];

      let updatedEntries = [...currentEntries];

      if (newNumberOfEntries > currentEntries.length) {
        const additionalEntries = Array.from(
          { length: newNumberOfEntries - currentEntries.length },
          (_, index) => ({
            id: new mongoose.Types.ObjectId(),
            name: `Entry #${currentEntries.length + index + 1}`,
            totalIn: 0,
            totalOut: 0,
            status: "open",
            doorKeepers: [],
          })
        );
        updatedEntries = [...currentEntries, ...additionalEntries];
      } else if (newNumberOfEntries < currentEntries.length) {
        updatedEntries = currentEntries.slice(0, newNumberOfEntries);
      }

      const updatedEvent = await Event.findByIdAndUpdate(
        id,
        {
          titleEvent: titleEvent || existingEvent.titleEvent,
          venue: venue || existingEvent.venue,
          maxParticipants:
            Number(maxParticipants) || existingEvent.maxParticipants,
          alertPoint: Number(alertPoint) || existingEvent.alertPoint,
          entries: updatedEntries,
        },
        { new: true }
      );

      if (!updatedEvent) {
        return res.status(404).json(createResponse(404, "Event not found"));
      }

      const events = await Event.find().lean();
      const modifiedEvents = events.map((event) => ({
        ...event,
        id: event._id,
        _id: undefined,
      }));

      return res.status(200).json(
        createResponse(200, "Event updated successfully", {
          events: modifiedEvents,
        })
      );
    } catch (error) {
      console.error("Error updating event:", error);
      return res
        .status(500)
        .json(
          createResponse(500, "Internal Server Error", { error: error.message })
        );
    }
  }
);

router.get(
  "/all",
  authenticateToken,
  checkRole(["admin"]),
  async (req, res) => {
    try {
      const events = await Event.find().lean();
      const modifiedEvents = events.map((event) => ({
        ...event,
        id: event._id,
        _id: undefined,
      }));

      return res.status(200).json(
        createResponse(200, "Events retrieved successfully", {
          events: modifiedEvents,
        })
      );
    } catch (error) {
      console.error("Error retrieving events:", error);
      return res
        .status(500)
        .json(
          createResponse(500, "Internal Server Error", { error: error.message })
        );
    }
  }
);

router.delete(
  "/event/:id",
  authenticateToken,
  checkRole(["admin"]),
  async (req, res) => {
    const { id } = req.params;

    try {
      const event = await Event.findById(id);

      if (!event) {
        return res.status(404).json(createResponse(404, "Event not found"));
      }

      await Event.deleteOne({ _id: id });

      return res
        .status(200)
        .json(
          createResponse(200, "Event deleted successfully", { eventId: id })
        );
    } catch (error) {
      console.error("Error deleting event:", error);
      return res
        .status(500)
        .json(
          createResponse(500, "Internal Server Error", { error: error.message })
        );
    }
  }
);

router.put(
  "/keeper/update/:id",
  authenticateToken,
  checkRole(["admin"]),
  async (req, res) => {
    const { id } = req.params;
    const { email, idKeeper } = req.body;

    try {
      const event = await Event.findById(id);

      if (!event) {
        return res.status(404).json(createResponse(404, "Event not found"));
      }

      if (idKeeper) {
        let keeperUpdated = false;

        event.entries = event.entries.map((entry) => {
          if (entry.doorKeepers.includes(idKeeper)) {
            entry.doorKeepers = entry.doorKeepers.map((keeper) =>
              keeper.id === idKeeper ? { ...keeper, email } : keeper
            );
            keeperUpdated = true;
          }
          return entry;
        });

        if (!keeperUpdated) {
          return res
            .status(404)
            .json(
              createResponse(404, "Specified keeper not found in any entry")
            );
        }

        await event.save();

        const modifiedEvent = {
          ...event.toObject(),
          id: event._id,
          _id: undefined,
        };

        return res.status(200).json(
          createResponse(200, "DoorKeeper updated successfully", {
            event: modifiedEvent,
          })
        );
      }

      const user = await User.findOne({ email });

      let keeper;
      if (user) {
        keeper = {
          id: user._id.toString(),
          name: user.name,
          email: email,
        };
      } else {
        const newId = new mongoose.Types.ObjectId();
        keeper = {
          id: newId,
          name: `Keeper ${
            event.entries.reduce(
              (count, entry) => count + entry.doorKeepers.length,
              0
            ) + 1
          }`,
          email: email,
        };
      }

      const isAlreadyKeeper = event.entries.some((entry) =>
        entry.doorKeepers.some((keeper) => keeper.email === email)
      );

      if (isAlreadyKeeper) {
        return res
          .status(400)
          .json(
            createResponse(
              400,
              "This email is already assigned as a doorKeeper"
            )
          );
      }

      const entryWithSpace = event.entries.find(
        (entry) => entry.doorKeepers.length < 5
      );

      if (!entryWithSpace) {
        return res
          .status(400)
          .json(
            createResponse(400, "No entry available to assign a new doorKeeper")
          );
      }

      entryWithSpace.doorKeepers.push(keeper);

      await event.save();

      const modifiedEvent = {
        ...event.toObject(),
        id: event._id,
        _id: undefined,
      };

      return res.status(200).json(
        createResponse(200, "DoorKeeper added successfully", {
          event: modifiedEvent,
        })
      );
    } catch (error) {
      console.error("Error updating doorKeeper:", error);
      return res
        .status(500)
        .json(
          createResponse(500, "Internal Server Error", { error: error.message })
        );
    }
  }
);

router.delete(
  "/keeper/remove/:id",
  authenticateToken,
  checkRole(["admin"]),
  async (req, res) => {
    const { id } = req.params;
    const { entryId } = req.body;

    try {
      const event = await Event.findOne({ "entries.id": entryId });

      if (!event) {
        return res.status(404).json(createResponse(404, "Entry not found"));
      }

      const entry = event.entries.find((e) => e.id === entryId);
      if (!entry) {
        return res.status(404).json(createResponse(404, "Entry not found"));
      }

      const keeperIndex = entry.doorKeepers.findIndex(
        (keeper) => keeper.id === id
      );
      if (keeperIndex === -1) {
        return res.status(404).json(createResponse(404, "Keeper not found"));
      }

      entry.doorKeepers.splice(keeperIndex, 1);

      await event.save();

      const modifiedEvent = {
        ...event.toObject(),
        id: event._id,
        _id: undefined,
      };

      return res.status(200).json(
        createResponse(200, "DoorKeeper removed successfully", {
          event: modifiedEvent,
        })
      );
    } catch (error) {
      console.error("Error removing doorKeeper:", error);
      return res
        .status(500)
        .json(
          createResponse(500, "Internal Server Error", { error: error.message })
        );
    }
  }
);

router.delete(
  "/entry/remove/:id",
  authenticateToken,
  checkRole(["admin"]),
  async (req, res) => {
    const { id } = req.params;
    const { entryId } = req.body;

    try {
      const event = await Event.findOne({ "entries.id": entryId });

      if (!event) {
        return res.status(404).json(createResponse(404, "Entry not found"));
      }

      const entryIndex = event.entries.findIndex((e) => e.id === entryId);
      if (entryIndex === -1) {
        return res.status(404).json(createResponse(404, "Entry not found"));
      }

      event.entries.splice(entryIndex, 1);

      await event.save();

      const modifiedEvent = {
        ...event.toObject(),
        id: event._id,
        _id: undefined,
      };

      return res.status(200).json(
        createResponse(200, "Entry removed successfully", {
          event: modifiedEvent,
        })
      );
    } catch (error) {
      console.error("Error removing entry:", error);
      return res
        .status(500)
        .json(
          createResponse(500, "Internal Server Error", { error: error.message })
        );
    }
  }
);

router.put(
  "/entry/status/:id",
  authenticateToken,
  checkRole(["admin"]),
  async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
      const event = await Event.findOne({ "entries.id": id });

      if (!event) {
        return res.status(404).json(createResponse(404, "Entry not found"));
      }

      const entry = event.entries.find((e) => e.id === id);
      if (!entry) {
        return res.status(404).json(createResponse(404, "Entry not found"));
      }

      entry.status = status;

      await event.save();

      const modifiedEvent = {
        ...event.toObject(),
        id: event._id,
        _id: undefined,
      };

      return res.status(200).json(
        createResponse(200, "Entry status updated successfully", {
          event: modifiedEvent,
        })
      );
    } catch (error) {
      console.error("Error updating entry status:", error);
      return res
        .status(500)
        .json(
          createResponse(500, "Internal Server Error", { error: error.message })
        );
    }
  }
);

router.get(
  "/keeper/:keeperId",
  authenticateToken,
  checkRole(["admin", "keeper"]),
  async (req, res) => {
    const { keeperId } = req.params;

    try {
      const events = await Event.find({}).lean();

      const filteredEvents = events.filter((event) => {
        return event.entries.some((entry) => {
          return entry.doorKeepers.some((keeper) => {
            return keeper.id === keeperId;
          });
        });
      });

      if (filteredEvents.length === 0) {
        return res.status(404).json(
          createResponse(404, "No events found for this keeper", {
            events: [],
          })
        );
      }
      const modifiedEvents = filteredEvents.map((event) => ({
        ...event,
        id: event._id,
        _id: undefined,
      }));

      return res.status(200).json(
        createResponse(200, "Events retrieved successfully for keeper", {
          events: modifiedEvents,
        })
      );
    } catch (error) {
      console.error("Error retrieving events for keeper:", error);
      return res
        .status(500)
        .json(
          createResponse(500, "Internal Server Error", { error: error.message })
        );
    }
  }
);

router.put(
  "/event/:eventId/entry/:entryId/increment",
  authenticateToken,
  checkRole(["admin", "keeper"]),
  async (req, res) => {
    const { eventId, entryId } = req.params;

    try {
      const event = await Event.findOne({
        _id: new mongoose.Types.ObjectId(eventId),
      });
      if (!event) {
        return res
          .status(404)
          .json(createResponse(404, "Event not found", { eventId }));
      }

      const entry = event.entries.find((e) => e.id === entryId);
      if (!entry) {
        return res
          .status(404)
          .json(createResponse(404, "Entry not found", { entryId }));
      }

      if (entry.status === "open") {
        entry.totalIn++;
        await event.save();
        return res
          .status(200)
          .json(
            createResponse(200, "totalIn incremented successfully", { entry })
          );
      } else {
        return res
          .status(400)
          .json(
            createResponse(400, "Cannot add guests once closed", { entry })
          );
      }
    } catch (error) {
      console.error("Error incrementing entry:", error);
      return res
        .status(500)
        .json(
          createResponse(500, "Internal Server Error", { error: error.message })
        );
    }
  }
);

router.put(
  "/event/:eventId/entry/:entryId/decrement",
  authenticateToken,
  checkRole(["admin", "keeper"]),
  async (req, res) => {
    const { eventId, entryId } = req.params;

    try {
      const event = await Event.findOne({
        _id: new mongoose.Types.ObjectId(eventId),
      });
      if (!event) {
        return res
          .status(404)
          .json(createResponse(404, "Event not found", { eventId }));
      }

      const entry = event.entries.find((e) => e.id === entryId);
      if (!entry) {
        return res
          .status(404)
          .json(createResponse(404, "Entry not found", { entryId }));
      }

      entry.totalOut++;
      await event.save();
      return res
        .status(200)
        .json(
          createResponse(200, "totalOut incremented successfully", { entry })
        );
    } catch (error) {
      console.error("Error incrementing entry:", error);
      return res
        .status(500)
        .json(
          createResponse(500, "Internal Server Error", { error: error.message })
        );
    }
  }
);

export default router;
