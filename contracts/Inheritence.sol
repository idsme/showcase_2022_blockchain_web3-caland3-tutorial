pragma solidity ^0.8.7;

contract Ownable {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOWner() {
        require(msg.sender == owner, "only owner has right to execute this function");
        _;
    }
}

contract SecretVault {
    string secret;
    constructor(string memory _secret) {
        secret = _secret;
    }

    function getSecret() public view returns(string memory) {
        return secret;
    }
}

contract MyContract is Ownable {
    address secretVault;


    constructor(string memory _secret) {
        super;
        secretVault = address(new SecretVault(_secret));
    }

    function getSecret() public view onlyOWner returns(string memory) {
        SecretVault _secretVault = SecretVault(secretVault);
        return _secretVault.getSecret();
    }

}
