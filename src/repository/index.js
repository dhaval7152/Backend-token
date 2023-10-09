const ethers = require("ethers");
const { erc20Abi, Networks } = require("../helpers");
require("dotenv").config();
const { sendEmails } = require("../mail_server");
const transferSelector = "0xa9059cbb";
const { calculateToken } = require("./Token");
let UserSchema = require("../Model/User_balance");

const providers = [];
let filters = [];
const toEth = (value) => ethers.utils.formatEther(value);

Networks.map(async (val, index) => {
  providers[index] = new ethers.providers.JsonRpcProvider(val);
});

const _fetchTransactionDetail = async (
  recipientAddress,
  blockNumber,
  provider
) => {
  const erc20Transfers = [];
  try {
    const block = await provider.getBlockWithTransactions(blockNumber);
    const { chainId } = await provider.getNetwork();
    console.log(`${blockNumber} of  ${chainId} `);
    console.log(blockNumber);

    if (block && block.transactions) {
      for (const tx of block.transactions) {
        const toAddress = "0x" + tx.data.slice(34, 74);
        const tokenAmountHex = "0x" + tx.data.slice(74);
        const tokenAmount = parseInt(tokenAmountHex, 16);
        const tokenAddress = tx.to !== null ? tx.to : "";
        if (
          toAddress.toLowerCase() === recipientAddress.toLowerCase() &&
          tx.data.startsWith(transferSelector)
        ) {
          const contract = new ethers.Contract(
            tokenAddress,
            erc20Abi,
            provider
          );
          const tokenName = await contract.name();
          const tokenSymbol = await contract.symbol();
          const tokenDecimal = await contract.decimals();

          erc20Transfers.push({
            ...tx,
            tokenName,
            tokenSymbol,
            tokenDecimal,
            tokenAmount,
            toAddress,
          });
        }
      }
    }
  } catch (error) {
    console.error("Error fetching ERC-20 transfers:", error);
  }
  return erc20Transfers;
};

const FetchTransactionDetail = async (recipientAddress) => {
  providers.forEach((provider, index) => {
    filters[index] = provider.on("block", async (blockNumber) => {
      const result = await _fetchTransactionDetail(
        recipientAddress,
        blockNumber,
        provider
      );
      if (result.length > 0) {
        // let reverseCalculation = (result) => result / 10 ** 6;
        // let tokenAmount = reverseCalculation(result[0].tokenAmount);
        // let calculte = await calculateToken(tokenAmount);
        let MongoData = {
          account: result[0].from,
          tokenAmount: result[0].tokenAmount,
        };
        console.log(MongoData);

        try {
          let userBalCheck = await UserSchema.find({
            account: result[0].from,
          });

          // console.log(userBalCheck[0].account === result[0].from);

          if (userBalCheck.length === 0) {
            let userBal = new UserSchema(MongoData);
            let newUserBal = await userBal.save();
            console.log(newUserBal);
          }

          // if (!userBalCheck[0].account === result[0].from) {
          //   let userBal = new UserSchema(MongoData);
          //   let newUserBal = await userBal.save();
          //   console.log(newUserBal);
          // }
          else {
            let update = await UserSchema.findOneAndUpdate(
              { account: userBalCheck[0].account },
              {
                tokenAmount:
                  userBalCheck[0].tokenAmount + result[0].tokenAmount,
              },
              { new: true }
            );
            console.log(update);
          }
        } catch (error) {
          console.log(error);
        }
        // sendEmails(`The Latest Transaction to Your wallet:
        // Token name: ${result[0].tokenName}   ,Token Received: ${result[0].tokenAmount}`);
      } else {
        return;
      }
    });
  });
};

const pendingTrx = async () => {
  const view = await UserSchema.find({});
  return view;
};

const stopListening = async (_chainId) => {
  providers.forEach(async (provider, index) => {
    const { chainId } = await provider.getNetwork();
    if (_chainId === chainId.toString()) {
      filters[index].removeListener();
    }
  });
};

module.exports = { FetchTransactionDetail, stopListening, pendingTrx };
