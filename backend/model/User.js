const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name:{
            type: String,
            required:true
        },
        email:{
            type:String,
            required:true,
            unique:true
        },
        password:{
            type:String,
            required:true
        },
        role:{
            type:String,
            enum :['user','admin'],
            default:'user'
        },
        verified:{
            type:Boolean,
            default:false
        },
        otpHash: {
            type: String,
            select: false
        },
        otpExpiresAt: {
            type: Date,
            select: false
        },
        otpAttempts: {
            type: Number,
            default: 0,
            select: false
        },
        otpLastSentAt: {
            type: Date,
            select: false
        }
    }
)

module.exports = mongoose.model('User', userSchema);
