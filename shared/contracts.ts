export const CONTRACT_ADDRESSES = {
  HYBRID_P2P: '0xE1eD8da387AcDF4BaB818f8Fc12cFc03314cDf7E',
  USDT: '0x3afb9f97834839d1E443A0322e110D8ec9F24cc7',
} as const;

export const POLYGON_AMOY_CHAIN_ID = 80002;
export const POLYGON_MAINNET_CHAIN_ID = 137;

export const NETWORK_CONFIG = {
  chainId: POLYGON_AMOY_CHAIN_ID,
  chainName: 'Polygon Amoy Testnet',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  rpcUrls: ['https://rpc-amoy.polygon.technology/'],
  blockExplorerUrls: ['https://www.oklink.com/amoy/'],
};

export const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_usdt",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_adminWallet",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "sponsor",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "binaryReceiver",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address[5]",
        "name": "matrixReceivers",
        "type": "address[5]"
      }
    ],
    "name": "ActivationCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newFeeUSDT",
        "type": "uint256"
      }
    ],
    "name": "ActivationFeeUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [],
    "name": "AdminWalletCancelled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "newAdmin",
        "type": "address"
      }
    ],
    "name": "AdminWalletConfirmed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "pendingAdmin",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "at",
        "type": "uint256"
      }
    ],
    "name": "AdminWalletProposed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint32",
        "name": "cycle",
        "type": "uint32"
      }
    ],
    "name": "AutoReEntryCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint32",
        "name": "left",
        "type": "uint32"
      },
      {
        "indexed": false,
        "internalType": "uint32",
        "name": "right",
        "type": "uint32"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "qualified",
        "type": "bool"
      }
    ],
    "name": "BinaryDirectQualified",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newAccruedUSDT",
        "type": "uint256"
      }
    ],
    "name": "BinaryMatchEarningUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "left",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "right",
        "type": "uint8"
      }
    ],
    "name": "BinaryMatchingCriteriaUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "newPairsPaidNow",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "totalPairs",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "paidAmount",
        "type": "uint256"
      }
    ],
    "name": "BinaryPairsMatched",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "leftRequired",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "rightRequired",
        "type": "uint8"
      }
    ],
    "name": "BinaryQualificationUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "ancestor",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "leftUnits",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "rightUnits",
        "type": "uint64"
      }
    ],
    "name": "BinaryUnitsBubbled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "label",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "holder",
        "type": "string"
      }
    ],
    "name": "CreatorCardAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "CreatorCardRemoved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "newLabel",
        "type": "string"
      }
    ],
    "name": "CreatorCardRenamed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "label",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "holder",
        "type": "string"
      }
    ],
    "name": "CreatorCardUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "version",
        "type": "uint8"
      }
    ],
    "name": "Initialized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "matrixIndex",
        "type": "uint256"
      }
    ],
    "name": "MatrixFull",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "parent",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "side",
        "type": "string"
      }
    ],
    "name": "MatrixPlaced",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Paused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "receiver",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "slotIndex",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "usdtAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "mode",
        "type": "string"
      }
    ],
    "name": "PaymentConfirmed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "receiver",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "slotIndex",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "proof",
        "type": "string"
      }
    ],
    "name": "ProofSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "sponsor",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "fromUser",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "mode",
        "type": "string"
      }
    ],
    "name": "SponsorIncomeUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "USDTAddressUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Unpaused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "holderName",
        "type": "string"
      }
    ],
    "name": "UserCardUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "sponsor",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "side",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "pbId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "mobile",
        "type": "string"
      }
    ],
    "name": "UserFullyActivated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "pbId",
        "type": "string"
      }
    ],
    "name": "UserIdUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "parent",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "side",
        "type": "uint8"
      }
    ],
    "name": "UserPlacedBinary",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "UserPlacedGlobalMatrix",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "sponsor",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "side",
        "type": "uint8"
      }
    ],
    "name": "UserPreRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "email",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "mobile",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "avatar",
        "type": "string"
      }
    ],
    "name": "UserProfileUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint32",
        "name": "cycle",
        "type": "uint32"
      }
    ],
    "name": "UserReEntered",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "SLOT_BINARY",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "SLOT_COUNT",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "SLOT_CREATOR",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "SLOT_ML1",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "SLOT_ML2",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "SLOT_ML3",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "SLOT_ML4",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "SLOT_ML5",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "SLOT_SPONSOR",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "activationFeeUSDT",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "activations",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "label",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "holderName_",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "bankName_",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "accountNumber_",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "ifscOrSwift_",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "upiId_",
        "type": "string"
      }
    ],
    "name": "addCreatorPaymentCard",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "adminActivate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "adminDeactivate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "adminWallet",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "binaryMatchLeft",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "binaryMatchRight",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "binaryPairPayoutUSDT",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "binaryPlaced",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "binaryRequiredLeft",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "binaryRequiredRight",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "binaryStates",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "directLeft",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "directRight",
        "type": "uint32"
      },
      {
        "internalType": "uint64",
        "name": "leftUnits",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "rightUnits",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "pairsMatched",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "binaryTree",
    "outputs": [
      {
        "internalType": "address",
        "name": "parent",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "left",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "right",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "buyReEntry",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "cancelAdminWalletUpdate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "confirmAdminWallet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "fromUser",
        "type": "address"
      },
      {
        "internalType": "uint8",
        "name": "slotIndex",
        "type": "uint8"
      }
    ],
    "name": "confirmOfflinePayment",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "creatorCardCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "creatorCards",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "label",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "holderName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "bankName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "accountNumber",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "ifscOrSwift",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "upiId",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "active",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "label",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "holderName_",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "bankName_",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "accountNumber_",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "ifscOrSwift_",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "upiId_",
        "type": "string"
      }
    ],
    "name": "editCreatorPaymentCard",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getActivation",
    "outputs": [
      {
        "internalType": "bool",
        "name": "hasActivation",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "activated",
        "type": "bool"
      },
      {
        "internalType": "address[8]",
        "name": "receivers",
        "type": "address[8]"
      },
      {
        "internalType": "uint256[8]",
        "name": "amounts",
        "type": "uint256[8]"
      },
      {
        "internalType": "bool[8]",
        "name": "paid",
        "type": "bool[8]"
      },
      {
        "internalType": "bool[8]",
        "name": "verifiedOnchain",
        "type": "bool[8]"
      },
      {
        "internalType": "string[8]",
        "name": "modes",
        "type": "string[8]"
      },
      {
        "internalType": "string[8]",
        "name": "proofs",
        "type": "string[8]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllCreatorCards",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "label",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "holderName",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "bankName",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "accountNumber",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "ifscOrSwift",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "upiId",
            "type": "string"
          },
          {
            "internalType": "bool",
            "name": "active",
            "type": "bool"
          }
        ],
        "internalType": "struct HybridP2P_Rooted.CreatorCard[]",
        "name": "cards",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getBinaryReport",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "directLeft",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "directRight",
        "type": "uint32"
      },
      {
        "internalType": "bool",
        "name": "qualified",
        "type": "bool"
      },
      {
        "internalType": "uint64",
        "name": "leftUnits",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "rightUnits",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "pairsMatched",
        "type": "uint64"
      },
      {
        "internalType": "uint256",
        "name": "accruedUSDT",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMatrixSummary",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "totalPlaced",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "nextIndex",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserBinary",
    "outputs": [
      {
        "internalType": "address",
        "name": "parent",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "left",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "right",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserMatrixPosition",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "parentIndex",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "parent",
        "type": "address"
      },
      {
        "internalType": "uint8",
        "name": "level",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "leftChildIndex",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "rightChildIndex",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserProfile",
    "outputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "email",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "mobile",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "avatar",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "profileCompleted",
        "type": "bool"
      },
      {
        "internalType": "string",
        "name": "holderName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "bankName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "accountNumber",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "ifscOrSwift",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "upiId",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "lastProposalTime",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "matrixGlobal",
    "outputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "parentIndex",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "parent",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "filled",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "matrixIndexOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextMatrixIndex",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "slotIndex",
        "type": "uint8"
      }
    ],
    "name": "payIndividuallyWeb3",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pendingAdminWallet",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sponsor",
        "type": "address"
      },
      {
        "internalType": "uint8",
        "name": "side",
        "type": "uint8"
      }
    ],
    "name": "preregister",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_admin",
        "type": "address"
      }
    ],
    "name": "proposeAdminWallet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "removeCreatorPaymentCard",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "setActivationFeeUSDT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "left",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "right",
        "type": "uint8"
      }
    ],
    "name": "setBinaryMatchingCriteria",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "setBinaryPairPayoutUSDT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "leftCount",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "rightCount",
        "type": "uint8"
      }
    ],
    "name": "setBinaryQualification",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256[8]",
        "name": "newAmts",
        "type": "uint256[8]"
      }
    ],
    "name": "setSlotAmounts",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_usdt",
        "type": "address"
      }
    ],
    "name": "setUSDT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "i",
        "type": "uint256"
      }
    ],
    "name": "slotAmounts",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "slotIndex",
        "type": "uint8"
      },
      {
        "internalType": "string",
        "name": "utrOrTx",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "proof",
        "type": "string"
      }
    ],
    "name": "submitOfflineProof",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unpause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "holderName_",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "bankName_",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "accountNumber_",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "ifscOrSwift_",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "upiId_",
        "type": "string"
      }
    ],
    "name": "updateUserPaymentCard",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "email",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "mobile",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "avatar",
        "type": "string"
      }
    ],
    "name": "updateUserProfile",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "usdt",
    "outputs": [
      {
        "internalType": "contract IERC20",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "userProfiles",
    "outputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "email",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "mobile",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "avatar",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "profileCompleted",
        "type": "bool"
      },
      {
        "internalType": "string",
        "name": "holderName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "bankName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "accountNumber",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "ifscOrSwift",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "upiId",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "withdrawToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
] as const;

export const USDT_ABI = [
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "name": "",
        "type": "string"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_spender",
        "type": "address"
      },
      {
        "name": "_value",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_from",
        "type": "address"
      },
      {
        "name": "_to",
        "type": "address"
      },
      {
        "name": "_value",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "name": "",
        "type": "uint8"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "_owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "name": "balance",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "name": "",
        "type": "string"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_to",
        "type": "address"
      },
      {
        "name": "_value",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "_owner",
        "type": "address"
      },
      {
        "name": "_spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
] as const;
