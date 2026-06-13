// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract Certificate is AccessControl {
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
        string calldata _id,
        string calldata _studentName,
        string calldata _matricNumber,
        string calldata _degree,
        string calldata _ipfsHash,
        string calldata _institution
    ) external onlyRole(ISSUER_ROLE) {
        // Prevent overwriting existing certificates
        if (bytes(certificates[_id].studentName).length != 0) {
            revert CertificateAlreadyExists(_id);
        }

        certificates[_id] = Cert(
            _studentName,
            _matricNumber,
            _degree,
            _ipfsHash,
            _institution,
            msg.sender
        );

        emit CertificateIssued(_id, _studentName, _matricNumber, _degree, _ipfsHash, _institution, msg.sender);
    }

    // Issue multiple certificates in a single transaction (batch minting)
    function issueCertificatesBatch(
        string[] calldata _ids,
        string[] calldata _studentNames,
        string[] calldata _matricNumbers,
        string[] calldata _degrees,
        string[] calldata _ipfsHashes,
        string calldata _institution
    ) external onlyRole(ISSUER_ROLE) {
        uint256 total = _ids.length;
        if (
            total != _studentNames.length ||
            total != _matricNumbers.length ||
            total != _degrees.length ||
            total != _ipfsHashes.length
        ) {
            revert ArrayLengthMismatch();
        }

        for (uint256 i = 0; i < total;) {
            string calldata _id = _ids[i];
            if (bytes(certificates[_id].studentName).length != 0) {
                revert CertificateAlreadyExists(_id);
            }

            certificates[_id] = Cert(
                _studentNames[i],
                _matricNumbers[i],
                _degrees[i],
                _ipfsHashes[i],
                _institution,
                msg.sender
            );

            emit CertificateIssued(_id, _studentNames[i], _matricNumbers[i], _degrees[i], _ipfsHashes[i], _institution, msg.sender);

            unchecked {
                ++i;
            }
        }
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
            string memory institution, // ✅ Return school name
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
            cert.institution, // ✅ Return school name
            cert.issuer
        );
    }
}