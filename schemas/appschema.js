const { Schema, model } = require("mongoose")

const appSchema = new Schema({
    _id: Schema.Types.ObjectId,
    guildId: String,
    channelId: String,
    roleId: String,
    userId: String,
})

module.exports = model("applicationSchema", appSchema, "applications")
