import mongoose from "mongoose";

const doorKeeperSchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true }
});

const entrySchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    totalIn: { type: Number, required: true },
    totalOut: { type: Number, required: true },
    status: { type: String, enum: ["open", "close"], required: true },
    doorKeepers: [doorKeeperSchema]
});

const notificationSchema = new mongoose.Schema({
    type: { type: String, enum: ["email", "sms"], required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["pending", "sent", "failed"], required: true }
});

const eventSchema = new mongoose.Schema({
    titleEvent: { type: String, required: true },
    venue: { type: String, required: true },
    maxParticipants: { type: Number, required: true },
    alertPoint: { type: Number, required: true },
    startTime: { type: Date, required: false },
    endTime: { type: Date, required: false },
    description: { type: String, required: false },
    status: { type: String, enum: ["scheduled", "ongoing", "completed", "cancelled"], required: true },
    entries: [entrySchema],
    notifications: [notificationSchema]
}, { timestamps: true });

export const Event = mongoose.model("Event", eventSchema);
