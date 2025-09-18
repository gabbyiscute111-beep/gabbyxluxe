const { Colors } = require('discord.js');
const { Schema, model, mongoose } = require('mongoose');


const statusSchema = new Schema({
    userid: {
        type: String,
        required: true
    },
    vanity: {
        type: String,
        required: false
    },
    channel: {
        type: String,
        required: false
    },
    color: {
        type: String,
        default: "#505050"
    },
    image: {
        type: String,
        required: false
    },
    thumbnail: {
        type: String,
        required: false
    },
    timestamp: {
        type: Boolean,
        required: false
    },
    enabled: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        required: false
    },
    // Embed fields
    title: {
        type: String,
        required: false
    },
    description: {
        type: String,
        required: false
    },
    footer: {
        type: String,
        required: false
    },
    author: {
        type: String,
        required: false
    },
    authorIcon: {
        type: String,
        required: false
    },
    // Vanity role
    vanityRole: {
        type: String,
        required: false
    }
});



module.exports = mongoose.models.Status || model('Status', statusSchema);