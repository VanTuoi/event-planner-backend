import mongoose from "mongoose";
import { io } from "./index.js";

export function setupChangeStreams() {
  const eventCollection = mongoose.connection.collection("events");

  eventCollection.watch().on("change", async (change) => {
    console.log("Detected change in events:", change);

    const events = await eventCollection.find().toArray();
    const modifiedEvents = events.map((event) => ({
      ...event,
      id: event._id,
      _id: undefined,
    }));

    io.emit("eventUpdated", { events: modifiedEvents });
  });
}
