import React, { useState, useEffect } from "react";
import { Button, Container, Toast, Table, Form, Row, Col } from "react-bootstrap";
import { Header } from "../Header.tsx";
import { Footer } from "../Footer.tsx";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";


export const OtpGenerator = () => {
  const [otp, setOtp] = useState("");
  const [show, setShow] = useState(false);
  const [secret, setSecret] = useState("");
  const [isSecretValid, setIsSecretValid] = useState(true);
  const [secretKeys, setSecretKeys] = useState(() => {
    // Initialize from local storage if available
    const storedKeys = localStorage.getItem("secretKeys");
    return storedKeys ? JSON.parse(storedKeys) : [];
  });
  const [timeRemaining, setTimeRemaining] = useState(30); // in seconds

  // Function to generate OTP
  const generateOtp = () => {
    if (secret) {
      const newOtp = window.otplib.authenticator.generate(secret.trim());
      setOtp(newOtp);
      setIsSecretValid(true);

      // Check if the secret key is already in the list
      const keyExists = secretKeys.some((key) => key.key === secret.trim());
      if (!keyExists) {
        // Add the secret key with timestamp to the list
        const newSecret = {
          key: secret.trim(),
          timestamp: new Date().toLocaleString() // Human-readable timestamp
        };
        const updatedKeys = [...secretKeys, newSecret];
        setSecretKeys(updatedKeys);
        localStorage.setItem("secretKeys", JSON.stringify(updatedKeys)); // Save to local storage
      }
    } else {
      setOtp("");
      setIsSecretValid(false);
    }
  };

  // Handle change in secret key input
  const handleSecretChange = (e) => {
    // Remove spaces from the secret key
    const cleanedSecret = e.target.value.replace(/\s/g, "");
    setSecret(cleanedSecret);
  };

  // Validate the secret key format
  const validateSecretKey = () => {
    const formattedSecret = secret.replace(/\s/g, "");

    // Check if the secret key meets your validation criteria
    if (formattedSecret.length === 16 || formattedSecret.length === 32) {
      return true;
    } else {
      return false;
    }
  };

  // Set up interval for OTP regeneration and countdown timer
  useEffect(() => {
    const timerId = setInterval(() => {
      setTimeRemaining((prevTime) => {
        if (prevTime <= 0) {
          if (validateSecretKey() && secret) {
            generateOtp();
            return 30; // Reset timer to 30 seconds
          } else {
            return 0;
          }
        } else {
          return prevTime - 1;
        }
      });
    }, 1000);

    return () => clearInterval(timerId); // Clear interval on component unmount
  }, [secret, validateSecretKey]); // Include validateSecretKey in dependencies

  // Manually regenerate OTP
  const handleRegenerateClick = () => {
    if (validateSecretKey() && secret) {
      generateOtp();
    }
  };

  return (
    <Container>
      <Header />
      <div className="text-center">
        <h1>OTP Generator</h1>
      </div>

      <Form>
        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2">
            Secret Key:
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="text"
              placeholder="Enter your secret key"
              value={secret}
              onChange={handleSecretChange}
              isInvalid={!isSecretValid}
            />
            <Form.Control.Feedback type="invalid">
              Secret key must be 16 or 32 characters long.
            </Form.Control.Feedback>
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2">
            Your OTP:
          </Form.Label>
          <Col sm="10">
            <Form.Control
              id="otp"
              readOnly
              plaintext
              value={otp}
              placeholder="No OTP generated"
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3" controlId="copy-to-clipboard">
          <Col sm="10">
            <Button onClick={handleRegenerateClick} disabled={!isSecretValid}>
              {isSecretValid ? "New OTP" : "Invalid Secret Key"}
            </Button>
            <CopyToClipboard text={otp}>
              <Button
                onClick={() => setShow(true)}
                disabled={!isSecretValid || otp === ""}
              >
                Copy to clipboard
              </Button>
            </CopyToClipboard>
          </Col>
        </Form.Group>
      </Form>

      <Row className="justify-content-center mt-4">
        <Col xs="auto">
          <div style={{ width: 100, height: 100 }}>
            <CircularProgressbar
              value={(timeRemaining / 30) * 100}
              text={`${timeRemaining}s`}
            />
          </div>
        </Col>
      </Row>

      <Row>
        <Col xs={12}>
          <Table striped bordered hover>
            <thead>
            <tr>
              <th>#</th>
              <th>Secret Key</th>
              <th>Timestamp</th>
            </tr>
            </thead>
            <tbody>
            {secretKeys.map((key, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{key.key}</td>
                <td>{key.timestamp}</td>
              </tr>
            ))}
            </tbody>
          </Table>
        </Col>
      </Row>

      <Row>
        <Col xs={6}>
          <Toast onClose={() => setShow(false)} show={show} delay={3000} autohide>
            <Toast.Header>
              <strong className="me-auto">Info</strong>
            </Toast.Header>
            <Toast.Body>Woohoo, your OTP is copied!</Toast.Body>
          </Toast>
        </Col>
      </Row>

      <Footer />
    </Container>
  );
};
