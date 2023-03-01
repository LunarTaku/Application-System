const { Schema, model } = require("mongoose")

const appSchema = new Schema({
    _id: Schema.Types.ObjectId,
    userId: String,
    guildId: String,    
    reason: String,
    age: String,
    name: String,
    pronouns: String,
    location: String,
})

module.exports = model("applicationUserSchema", appSchema, "applicationUser")