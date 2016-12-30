import Email from '../models/email.model';
import mongoose from 'mongoose';
const ObjectId = mongoose.Types.ObjectId;

function getMonthlyPunchCard(userId){
  return Email.aggregate([
    {$match: { user: ObjectId(userId)}},
    {$project: {
        month: { $month: "$date" },
        day: { $dayOfMonth: "$date" }
      }
    },
    {$group: {_id: {month: '$month', day: '$day'}, count: {$sum:1}}},
    {$sort:{'_id.month':1, '_id.day':1}}
  ]);
}

function getDailyPunchCard(userId){
  return Email.aggregate([
    {$match: { user: ObjectId(userId)}},
    {
      $project: {
        day: { $dayOfMonth: "$date" },
        hour: { $hour: "$date" },
      }
    },
    {$group: {_id: {day: '$day', hour: '$hour'}, count: {$sum:1}}},
    {$sort:{'_id.day':1, '_id.hour':1}}
  ]);
}

function getTopSender(userId){
  return Email.aggregate([
    {$match: { user: ObjectId(userId)}},
    {$unwind: '$from'},
    {$group: {_id: {address: '$from.address', name: '$from.name'}, count: {$sum:1}}},
    {$sort: {'count':-1}}
  ]);
}

function getTopReceiver(userId){
  return Email.aggregate([
    {$match: { user: ObjectId(userId)}},
    {$unwind: '$to'},
    {$group: {_id: {address: '$to.address', name: '$to.name'}, count: {$sum:1}}},
    {$sort: {'count':-1}}
  ]);
}

function getSummary(req, res) {

  //TODO may consider only the last 12 month not all data ...
  //TODO differentiate between send, received and all mails
  //TODO use id of current user
  const userId = "5836fe8a14272b01c404257c";

  const s = {
    punchcard:{},
    network:{}
  };

  getMonthlyPunchCard(userId)
    .then((monthlySummary)=>{
      s.punchcard.monthly = monthlySummary;
      return getDailyPunchCard(userId);
    })
    .then((dailySummary)=>{
      s.punchcard.daily = dailySummary;
      return getTopSender(userId)
    })
    .then((topSender)=>{
      s.network.topsender = topSender;
      return getTopReceiver(userId)
    })
    .then((topReceiver)=>{
      s.network.topreceiver = topReceiver;
      res.status(200).send(s);
  });

}


export default {
  getSummary
};
