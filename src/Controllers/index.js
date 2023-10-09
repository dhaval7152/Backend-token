require("dotenv").config();
const {
  FetchTransactionDetail,
  stopListening,
  pendingTrx
} = require("../repository/index");
const { getStartTime, calculateToken } = require("../repository/Token.js");
//

exports.getTransaction = async (req, res) => {
  let account = req.params.account;
  FetchTransactionDetail(account);
  res.send({ status: "listening to block..." });
};

exports.getStartTime = async (req, res) => {
  let startTime = await getStartTime();
  res.send({ startTime });
};
exports.updateBalance = async (req, res) => {
  let { account, tokenAmount } = req.body;
  let data = calculateToken(tokenAmount, account);
  res.send(data);
};
exports.viewTrx = async (req, res) => {
  let trx= await pendingTrx()
  res.send(trx)

};

exports.stopListening = async (req, res) => {
  let chainId = req.params.chainid;
  stopListening(chainId);
  res.send("Stoped listening...");
};
