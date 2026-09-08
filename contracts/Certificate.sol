// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Certificate is AccessControl, ERC721 {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    // Custom Errors for Gas Optimization
    error CertificateAlreadyExists(string id);
    error ArrayLengthMismatch();
    error CertificateNotFound(string id);

    event CertificateIssued(
        string id,
        string studentName,
        string matricNumber,
        string degree,
        string ipfsHash,
        string institution,
        address indexed studentWallet,
        address indexed issuer
    );

    constructor() ERC721("AuthenX Credential", "AUTHX") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ISSUER_ROLE, msg.sender);
    }

    struct Cert {
        string studentName;
        string matricNumber;
        string degree;
        string ipfsHash;
        string institution;
        address studentWallet; 
        address issuer;  
    }

    mapping(string => Cert) private certificates;

    // Override transfer functions to make tokens non-transferable (Soulbound)
    function transferFrom(address from, address to, uint256 tokenId) public override {
        revert("Err: Soulbound tokens cannot be transferred.");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public override {
        revert("Err: Soulbound tokens cannot be transferred.");
    }

    // Override approvals to prevent market listings
    function approve(address to, uint256 tokenId) public override {
        revert("Err: Soulbound tokens cannot be approved.");
    }

    function setApprovalForAll(address operator, bool approved) public override {
        revert("Err: Soulbound tokens cannot be approved.");
    }

    // Issue a new certificate SBT
    function issueCertificate(
        string calldata _id,
        string calldata _studentName,
        string calldata _matricNumber,
        string calldata _degree,
        string calldata _ipfsHash,
        string calldata _institution,
        address _studentWallet
    ) external onlyRole(ISSUER_ROLE) {
        // Prevent overwriting existing certificates
        if (bytes(certificates[_id].studentName).length != 0) {
            revert CertificateAlreadyExists(_id);
        }

        uint256 tokenId = uint256(keccak256(abi.encodePacked(_id)));
        if (_studentWallet != address(0)) {
            _safeMint(_studentWallet, tokenId);
        }

        certificates[_id] = Cert(
            _studentName,
            _matricNumber,
            _degree,
            _ipfsHash,
            _institution,
            _studentWallet,
            msg.sender
        );

        emit CertificateIssued(_id, _studentName, _matricNumber, _degree, _ipfsHash, _institution, _studentWallet, msg.sender);
    }

    // Issue multiple certificates in a single transaction (batch minting)
    function issueCertificatesBatch(
        string[] calldata _ids,
        string[] calldata _studentNames,
        string[] calldata _matricNumbers,
        string[] calldata _degrees,
        string[] calldata _ipfsHashes,
        string calldata _institution,
        address[] calldata _studentWallets
    ) external onlyRole(ISSUER_ROLE) {
        uint256 total = _ids.length;
        if (
            total != _studentNames.length ||
            total != _matricNumbers.length ||
            total != _degrees.length ||
            total != _ipfsHashes.length ||
            total != _studentWallets.length
        ) {
            revert ArrayLengthMismatch();
        }

        for (uint256 i = 0; i < total;) {
            string calldata _id = _ids[i];
            if (bytes(certificates[_id].studentName).length != 0) {
                revert CertificateAlreadyExists(_id);
            }

            uint256 tokenId = uint256(keccak256(abi.encodePacked(_id)));
            if (_studentWallets[i] != address(0)) {
                _safeMint(_studentWallets[i], tokenId);
            }

            certificates[_id] = Cert(
                _studentNames[i],
                _matricNumbers[i],
                _degrees[i],
                _ipfsHashes[i],
                _institution,
                _studentWallets[i],
                msg.sender
            );

            emit CertificateIssued(_id, _studentNames[i], _matricNumbers[i], _degrees[i], _ipfsHashes[i], _institution, _studentWallets[i], msg.sender);

            unchecked {
                ++i;
            }
        }
    }

    // Assign student wallet and mint SBT if wallet was not provided during issuance
    function assignStudentWallet(string calldata _id, address _studentWallet) external onlyRole(ISSUER_ROLE) {
        if (bytes(certificates[_id].studentName).length == 0) {
            revert CertificateNotFound(_id);
        }
        if (_studentWallet == address(0)) {
            revert("Err: Invalid student wallet");
        }
        if (certificates[_id].studentWallet != address(0)) {
            revert("Err: Student wallet already assigned");
        }

        certificates[_id].studentWallet = _studentWallet;
        uint256 tokenId = uint256(keccak256(abi.encodePacked(_id)));
        _safeMint(_studentWallet, tokenId);
    }

    // Verify certificate by ID
    function verifyCertificate(string calldata _id)
        external
        view
        returns (
            string memory studentName,
            string memory matricNumber,
            string memory degree,
            string memory ipfsHash,
            string memory institution,
            address studentWallet,
            address issuer
        )
    {
        Cert memory cert = certificates[_id];
        if (bytes(cert.studentName).length == 0) {
            revert CertificateNotFound(_id);
        }

        return (
            cert.studentName,
            cert.matricNumber,
            cert.degree,
            cert.ipfsHash,
            cert.institution,
            cert.studentWallet,
            cert.issuer
        );
    }

    // Required overrides for Solidity multiple inheritance resolution
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}