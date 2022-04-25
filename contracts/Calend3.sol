// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Calend3 {

    uint rate = 1;
    address owner;

    constructor(uint _rate) {
        owner = msg.sender;
        rate = _rate;
    }

    function getRate() public view returns (uint) {
        return rate;
    }

    function setRate(uint _rate) public {
        require(msg.sender == owner, "Only owner can change rate");
        rate = _rate;
    }

}