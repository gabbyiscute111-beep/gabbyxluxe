const { Colors } = require('discord.js');
const { Schema, model, mongoose } = require('mongoose');

const welcomeSchema = new Schema({
   guildId: {
      type: String,
      required: true
   },
   welcomeChannel: {
      type: String,
      required: false
   },
   title: {
      type: String,
      default: "welcome to the server!"
   },
   description: {
      type: String,
      default: "We're glad to have you here {user}!"
   },
color: {
   type: String,
   default: "#26160B"
},
image: {
   type: String,
   required: false,
   default: "https://cdn.discordapp.com/attachments/1411860865522728960/1412601325719523478/IMG_1693.jpg?ex=68c56940&is=68c417c0&hm=dab53b9bc2a9439e09d1eb73144b2aaf4cdfd92285420fdc9f4d761db1b1ae00&"
},
thumbnail: {
   type: String,
   required: false
},
timestamp: {
    type: Boolean,
    required: false,
},
enabled: {
    type: Boolean,
    default: false,
}, 
footer: {
    type: String,
    default:  " You are member number {memberCount}!",
    required: false
}
});

module.exports = mongoose.models.Welcome || model('Welcome', welcomeSchema);
