const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const userScheme = new Schema({
    userId: {
        type: Number,
        required: true
    },

    userFunds: {
        type: Number,
        default: 0
    },

    userFirstName: {
        type: String,
        default: ""
    },

    userLastName: {
        type: String,
        default: ""
    }
},
    {versionKey: false});

mongoose.model('users', userScheme);
