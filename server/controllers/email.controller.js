import Email from '../models/email.model';
import GmailConnector from '../helpers/mail/GmailConnector';
import SMTPConnector from '../helpers/mail/SMTPConnector';
import config from '../../config/env';
import Promise from 'bluebird';
import User from '../models/user.model';

/* This is just for developing, will be retrieved from user later */
const options = {
  user: config.email.user,
  password: config.email.pass,
  host: config.email.host,
  port: config.email.port,
  tls: true,
  mailbox: 'INBOX'
};

const smtpConfig = {
  host: config.smtp.host,
  port: config.smtp.port,
  secure: true,
  auth: {
    user: config.smtp.auth.user,
    pass: config.smtp.auth.pass
  }
};

function sendEmail(req, res) {
  const smtpConnector = new SMTPConnector(smtpConfig);
  smtpConnector.sendMail(req.body).then((result) => {
    /*  At the moment all mails are fetched when we start the synch process
    TO DO: write new function/endpoint to just fetch last couple of mails from sendBox  */
    const imapConnectorAllMessages = new GmailConnector(options);
    imapConnectorAllMessages.fetchEmails(storeEmail, config.gmail.allMessages).then((messages) => {
      res.status(200).send(messages);
    }).catch((err) => {
      res.status(400).send(err);
    });
  });
}

function fetchMails(req, res) {
  const syncTime = new Date();
  let promises = [];
  req.body.boxes.forEach((box) => {
    const imapConnector = new GmailConnector(options);
    promises.push(imapConnector.fetchEmails(storeEmail, box));
  })
  Promise.all(promises).then((results) => {
    syncDeletedMails(syncTime, req.body.boxes).then(() => {
      res.status(200).send(results);
    })
  }).catch((err) => {
    res.status(400).send(err);
  });
}

function generateBoxList(boxes, parent, arr) {
  Object.keys(boxes).forEach((key, i) => {
    const path = parent ? `${parent}/${key}` : key;
    if (key != '[Gmail]') {
      arr.push(path);
    }
    if (boxes[key].children) {
      generateBoxList(boxes[key].children, path, arr);
    }
  })
}

function getBoxes(user) {
  return new Promise((resolve, reject) => {
    const imapConnector = new GmailConnector(options);
    imapConnector.getBoxes().then((boxes) => {
      let boxList = [];
      generateBoxList(boxes, null, boxList);
      User.findOne({
        _id: user._id
      }, (err, user) => {
        if (err) {
          reject(err);
        }
        user.boxList = boxList;

        user.save().then(() => {
          resolve(boxList);
        })
      });
    }).catch((err) => {
      res.status(400).send(err);
    });
  })
}
// ToDo: Add Path/Prefix to Boxname automatically
function addBox(req, res) {
  const imapConnector = new GmailConnector(options);
  imapConnector.addBox(req.body.boxName).then((boxName) => {
    getBoxes(req.user).then(() => {
      res.status(200).send(`Created new box: ${boxName}`);
    });
  }).catch((err) => {
    res.status(400).send(err);
  });
}
// ToDo: Add Path/Prefix to Boxname automatically
function delBox(req, res) {
  const imapConnector = new GmailConnector(options);
  imapConnector.delBox(req.body.boxName).then((boxName) => {
    getBoxes(req.user).then(() => {
      res.status(200).send(`Deleted box: ${boxName}`);
    });
  }).catch((err) => {
    res.status(400).send(err);
  });
}
// ToDo: Add Path/Prefix to Boxname automatically
function renameBox(req, res) {
  const imapConnector = new GmailConnector(options);
  imapConnector.renameBox(req.body.oldBoxName, req.body.newBoxName).then((boxName) => {
    getBoxes(req.user).then(() => {
      res.status(200).send(`Renamed box to: ${boxName}`);
    });
  }).catch((err) => {
    res.status(400).send(err);
  });
}

function append(req, res) {
  const imapConnector = new GmailConnector(options);
  imapConnector.append(req.body.box, req.body.args, req.body.to, req.body.from, req.body.subject, req.body.msgData).then((msgData) => {
    imapConnector.fetchEmails(storeEmail, req.body.box).then(() => {
      res.status(200).send(msgData);
    })
  }).catch((err) => {
    res.status(400).send(err);
  });
}

function move(req, res) {
  const imapConnector = new GmailConnector(options);
  imapConnector.move(req.body.msgId, req.body.srcBox, req.body.box).then((messages) => {
    imapConnector.fetchEmails(storeEmail, req.body.box).then(() => {
      res.status(200).send(messages);
    })
  }).catch((err) => {
    res.status(400).send(err);
  });
}

function copy(req, res) {
  const imapConnector = new GmailConnector(options);
  imapConnector.copy(req.body.msgId, req.body.srcBox, req.body.box).then((messages) => {
    res.status(200).send(messages);
  }).catch((err) => {
    res.status(400).send(err);
  });
}

function addFlags(req, res) {
  const imapConnector = new GmailConnector(options);
  imapConnector.addFlags(req.body.msgId, req.body.flags, req.body.box).then((messages) => {
    res.status(200).send(messages);
  }).catch((err) => {
    res.status(400).send(err);
  });
}

function delFlags(req, res) {
  const imapConnector = new GmailConnector(options);
  imapConnector.delFlags(req.body.msgId, req.body.flags, req.body.box).then((messages) => {
    res.status(200).send(messages);
  }).catch((err) => {
    res.status(400).send(err);
  });
}

function setFlags(req, res) {
  const imapConnector = new GmailConnector(options);
  imapConnector.setFlags(req.body.msgId, req.body.flags, req.body.box).then((messages) => {
    res.status(200).send(messages);
  }).catch((err) => {
    res.status(400).send(err);
  });
}

function storeEmail(mail) {
  return new Promise((resolve, reject) => {
    Email.findOneAndUpdate({
      messageId: mail.messageId
    }, mail, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }, (err, email) => {
      if (err) {
        reject(err);
      }
      resolve(email);
    });
  });
}

function syncDeletedMails(syncTime, boxes) {
  return new Promise( (resolve, reject) => {
    Email.remove({box: {"$in" : boxes}, updatedAt: {"$lt": syncTime}} , (err) => {
      err ? reject(err) : resolve();
    })
  });
}

export default {
  fetchMails,
  getBoxes,
  addBox,
  delBox,
  renameBox,
  append,
  move,
  copy,
  sendEmail,
  addFlags,
  delFlags,
  setFlags
};
