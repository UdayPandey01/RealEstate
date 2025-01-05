const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

describe("Escrow", () => {
  let buyer, seller, inspector, lender;
  let realState, escrow;

  beforeEach(async () => {
    [buyer, seller, inspector, lender] = await ethers.getSigners();

    const RealState = await ethers.getContractFactory("RealEstate");
    realState = await RealState.deploy();
    await realState.deployed();

    let transaction = await realState
      .connect(seller)
      .mint(
        "https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS"
      );

    await transaction.wait();

    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy(
      realState.address,
      seller.address,
      inspector.address,
      lender.address
    );

    transaction = await realState.connect(seller).approve(escrow.address, 1);
    await transaction.wait();

    transaction = await escrow.connect(seller).list(1, tokens(10), buyer.address, tokens(5));
    await transaction.wait();
  });

  describe("deployment", () => {
    it("Returns NFT Address", async () => {
      const result = await escrow.nftAddress();
      expect(result).to.be.equal(realState.address);
    });

    it("Returns Seller", async () => {
      const result = await escrow.seller();
      expect(result).to.be.equal(seller.address);
    });

    it("Returns Inspector", async () => {
      const result = await escrow.inspector();
      expect(result).to.be.equal(inspector.address);
    });

    it("Returns Lender", async () => {
      const result = await escrow.lender();
      expect(result).to.be.equal(lender.address);
    });
  });

  describe("Listing", () => {
    it("Update as listed", async () => {
      const result = await escrow.isListed(1);
      expect(result).to.be.equal(true);
    })

    it("Updtates Ownership", async () => {
      expect(await realState.ownerOf(1)).to.be.equal(escrow.address);
    });

    it("Returns Buyer", async () => {
      const result = await escrow.buyer(1);
      expect(result).to.be.equal(buyer.address);
    })

    it("Returns purchase price", async () => {
      const result = await escrow.purchasePrice(1);
      expect(result).to.be.equal(tokens(10));
    })

    it("Returns escrow amount", async () => {
      const result = await escrow.escrowAmount(1);
      expect(result).to.be.equal(tokens(5));
    })
  });

  describe("Deposits", () => {
    it("Updates contract balance", async() => {
      const transaction = await escrow.connect(buyer).depositEarnest(1, {value: tokens(5)});
      await transaction.wait();
      const result = await escrow.getBalance(1);
      expect(result).to.be.equal(tokens(5));
    })
  });
});
