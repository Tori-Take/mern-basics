const mongoose = require('mongoose');

const hiyariSchema = new mongoose.Schema({
  // ★★★ STEP 4: userとtenantの関連付けを復活させる ★★★
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  tenant: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tenant', 
    required: true 
  },
  incidentDate: { 
    type: Date, 
    required: true 
  },
  details: { 
    type: String, 
    required: true 
  },
  category: { 
    type: String, 
    required: true, 
  },
}, { timestamps: true });

module.exports = mongoose.model('Hiyari', hiyariSchema);