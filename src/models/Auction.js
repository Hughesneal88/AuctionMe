const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  images: [{
    type: String
  }],
  startingBid: {
    type: Number,
    required: true,
    min: 0
  },
  currentBid: {
    type: Number,
    default: function() {
      return this.startingBid;
    }
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in hours
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'expired'],
    default: 'active'
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  winnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  firstBidTime: {
    type: Date,
    default: null
  },
  bidCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient querying
auctionSchema.index({ status: 1, endTime: 1 });
auctionSchema.index({ sellerId: 1 });

// Method to check if auction can be edited
auctionSchema.methods.canEdit = function() {
  return this.firstBidTime === null;
};

// Method to check if auction is expired
auctionSchema.methods.isExpired = function() {
  return new Date() > this.endTime;
};

module.exports = mongoose.model('Auction', auctionSchema);
