require("dotenv").config();
const pendingTrx = require("../Model/PendingBalance");
const confirmTrx = require("../Model/Confirmbalance");
let PendingSchema = require("../Model/PendingBalance");
const { calculateToken } = require("../repository/Token");
const { getStartTime } = require("../repository/Token");
const port = process.env.port;
const viewTrx = async () => {
  let trx = await pendingTrx.find({});
  return trx;
};

let getToken = process.env.getToken;

const getData = async () => {
  let startTime = await getStartTime();

  const response = await fetch(getToken, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ startTime }),
  });
  const jsonResponse = await response.json();
  console.log("🚀 -----------------------------------------🚀");
  console.log("🚀 ~ getData ~ jsonResponse:", jsonResponse);
  console.log("🚀 -----------------------------------------🚀");
};

const getUpdateBal = async (_dataToken) => {
  let { account, tokenAmount } = _dataToken;
  let data = await calculateToken(tokenAmount, account);
  console.log("🚀 ------------------------------🚀");
  console.log("🚀 ~ getUpdateBal ~ data:", data);
  console.log("🚀 ------------------------------🚀");
};

let trx;
isActive_GetUserBal = true;
const getUser_pendingTrx = async () => {
  if (isActive_GetUserBal == true) {
    console.log("Running in getUserBal");
    const jsonResponse = await viewTrx();
    trx = jsonResponse;

    async function processTrx(index) {
      if (index >= trx.length) {
        isActive_GetUserBal = false;
        console.log("All transactions processed, stopping getUser_pendingTrx.");
        // All transactions processed
        return true;
      }
      const oneTrx = trx[index];
      console.log("🚀 --------------------------------🚀");
      console.log("🚀 ~ processTrx ~ oneTrx:", oneTrx);
      console.log("🚀 --------------------------------🚀");

      const data = {
        tokenAmount: oneTrx.tokenAmount,
        account: oneTrx.account,
      };

      if (index === trx.length) {
        console.log("stoped Data fetching");
      }

      let user = await pendingTrx.find({ account: data.account });
      let deletRecord = await pendingTrx.deleteOne({
        account: user[0].account,
      });

      console.log("🚀 --------------------------------🚀");
      console.log("🚀 ~ Delete ~ deletRecord:", deletRecord);
      console.log("🚀 --------------------------------🚀");

      let cnfrmBalCheck = await confirmTrx.find({
        account: data.account,
      });

      if (cnfrmBalCheck.length === 0) {
        let confrim = new confirmTrx(data);
        let confrimUserBal = await confrim.save();
        console.log("🚀 ------------------------------------------------🚀");
        console.log("🚀 ~ processTrx ~ confrimUserBal:", confrimUserBal);
        console.log("🚀 ------------------------------------------------🚀");
      } else {
        let updateCnfrm = await confirmTrx.findOneAndUpdate(
          { account: data.account },
          {
            tokenAmount: cnfrmBalCheck[0].tokenAmount + data.tokenAmount,
          },
          { new: true }
        );
        console.log("🚀 ------------------------------------------🚀");
        console.log("🚀 ~ updateCnfrm ~ updateCnfrm:", updateCnfrm);
        console.log("🚀 ------------------------------------------🚀");
      }
      // Call getUpdateBal after a 5-second delay
      getUpdateBal(data);

      // Process the next transaction after the delay
      setTimeout(() => {
        processTrx(index + 1);
      }, 5000); // 5000 milliseconds (5 seconds)
    }

    // Start processing transactions
    processTrx(0);
  }
};
const PendingTransaction = async (_mongoData) => {
  try {
    let userBalCheck = await PendingSchema.find({
      account: _mongoData.account,
    });

    if (userBalCheck.length === 0) {
      let userBal = new PendingSchema(_mongoData);
      let newUserBal = await userBal.save();
    } else {
      let update = await PendingSchema.findOneAndUpdate(
        { account: userBalCheck[0].account },
        {
          tokenAmount: userBalCheck[0].tokenAmount + _mongoData.tokenAmount,
        },
        { new: true }
      );
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  getData,
  getUpdateBal,
  getUser_pendingTrx,
  PendingTransaction,
};
