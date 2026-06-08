// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract Certificate is AccessControl {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    event CertificateIssued(
        string id,
        string studentName,
        string matricNumber,
        string degree,
        string ipfsHash,
        string institution,
        address indexed issuer
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    struct Cert {
        string studentName;
        string matricNumber;
        string degree;
        string ipfsHash;
        string institution; // ✅ Added field for school name
        address issuer;  
    }

    mapping(string => Cert) private certificates;

    // Issue a new certificate
    function issueCertificate(
        string memory _id,
        string memory _studentName,
        string memory _matricNumber,
        string memory _degree,
        string memory _ipfsHash,
        string memory _institution // ✅ Added parameter
    ) public onlyRole(ISSUER_ROLE) {
        // Prevent overwriting existing certificates
        require(bytes(certificates[_id].studentName).length == 0, "Certificate ID already exists");

        certificates[_id] = Cert(
            _studentName,
            _matricNumber,
            _degree,
            _ipfsHash,
            _institution, // ✅ Store school name
            msg.sender
        );

        emit CertificateIssued(_id, _studentName, _matricNumber, _degree, _ipfsHash, _institution, msg.sender);
    }

    // Verify certificate by ID
    function verifyCertificate(string memory _id)
        public
        view
        returns (
            string memory studentName,
            string memory matricNumber,
            string memory degree,
            string memory ipfsHash,
            string memory institution, // ✅ Return school name
            address issuer
        )
    {
        Cert memory cert = certificates[_id];
        require(bytes(cert.studentName).length != 0, "Certificate not found");

        return (
            cert.studentName,
            cert.matricNumber,
            cert.degree,
            cert.ipfsHash,
            cert.institution, // ✅ Return school name
            cert.issuer
        );
    }
}