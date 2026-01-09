import { useState, useEffect } from "react";
import { Button, Container, Toast, Table, Form, Row, Col } from "react-bootstrap";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

export const OtpGenerator = () => {
  const [otp, setOtp] = useState("");
  const [show, setShow] = useState(false);
  const [secret, setSecret] = useState('');
  const [isSecretValid, setIsSecretValid] = useState(false);
  const [secretKeys, setSecretKeys] = useState(() => {
    const storedKeys = localStorage.getItem("secretKeys");
    return storedKeys ? JSON.parse(storedKeys) : [];
  });
  const [name, setName] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [showTableSecrets, setShowTableSecrets] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30);

  const generateOtp = (secretKey?: string) => {
    const keyToUse = secretKey || secret;
    if (keyToUse) {
      // @ts-ignore
      const newOtp = window.otplib.authenticator.generate(keyToUse.trim());
      setOtp(newOtp);
      setIsSecretValid(true);

      const keyExists = secretKeys.some((key: any) => key.key === keyToUse.trim());
      if (!keyExists) {
        const newSecret = {
          name: name.trim() || "Unnamed",
          key: keyToUse.trim(),
          timestamp: new Date().toLocaleString()
        };
        const updatedKeys = [...secretKeys, newSecret];
        setSecretKeys(updatedKeys);
        localStorage.setItem("secretKeys", JSON.stringify(updatedKeys));
      }
    } else {
      setOtp("");
      setIsSecretValid(false);
    }
  };

  const validateSecretKey = (key: string) => {
    const formattedSecret = key.replace(/\s/g, "");
    return formattedSecret.length === 16 || formattedSecret.length === 32;
  };

  const handleSecretChange = (e: any) => {
    const cleanedSecret = e.target.value.replace(/\s/g, "");
    setSecret(cleanedSecret);
    setIsSecretValid(validateSecretKey(cleanedSecret));
    if (!validateSecretKey(cleanedSecret)) {
      setOtp("");
    }
  };

  useEffect(() => {
    const timerId = setInterval(() => {
      setTimeRemaining((prevTime) => {
        if (prevTime <= 0) {
          if (isSecretValid && secret) {
            generateOtp();
            return 30;
          } else {
            return 0;
          }
        } else {
          return prevTime - 1;
        }
      });
    }, 1000);
    return () => clearInterval(timerId);
  }, [secret, isSecretValid]);

  const handleRegenerateClick = () => {
    if (isSecretValid && secret) {
      generateOtp();
    }
  };

  const handleClearSecret = () => {
    setSecret("");
    setName("");
    setOtp("");
    setIsSecretValid(false);
  };

  const handleClearAll = () => {
    setSecretKeys([]);
    localStorage.removeItem("secretKeys");
  };

  const handleSetCurrentSecret = (key: any, name: string) => {
    const isValid = validateSecretKey(key);
    setSecret(key);
    setIsSecretValid(isValid);
    setName(name);
    setOtp("");
    setTimeRemaining(30);
    if (isValid) {
      generateOtp(key);
    }
  };

  return (
    <Container>      <div className="text-center">
        <h1>OTP Generator</h1>
      </div>

      <Form>
        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2">
            Name:
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="text"
              placeholder="Enter a name for the secret key"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2">
            Secret Key:
          </Form.Label>
          <Col sm="8">
            <Form.Control
              type={showSecret ? "text" : "password"}
              placeholder="Enter your secret key"
              value={secret}
              onChange={handleSecretChange}
              isInvalid={secret.length > 0 && !isSecretValid}
            />
            <Form.Control.Feedback type="invalid">
              Secret key must be 16 or 32 characters long.
            </Form.Control.Feedback>
          </Col>
          <Col sm="2">
            <Button variant="secondary" onClick={() => setShowSecret(!showSecret)}>
              {showSecret ? "Hide" : "Show"}
            </Button>
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Col sm="2">
            <Button variant="danger" onClick={handleClearSecret}>Clear Secret</Button>
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2">
            Your OTP:
          </Form.Label>
          <Col sm="10">
            <Form.Control id="otp" readOnly plaintext value={otp} placeholder="No OTP generated" />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3" controlId="copy-to-clipboard">
          <Col sm="10">
            <Button onClick={handleRegenerateClick} disabled={!isSecretValid}>
              {isSecretValid ? "New OTP" : "Invalid Secret Key"}
            </Button>
            <CopyToClipboard text={otp}>
              <Button onClick={() => setShow(true)} disabled={!isSecretValid || otp === ""}>
                Copy to clipboard
              </Button>
            </CopyToClipboard>
          </Col>
        </Form.Group>
      </Form>

      {secret && isSecretValid && (
        <Row className="justify-content-center mt-4">
          <Col xs="auto">
            <div style={{ width: 100, height: 100 }}>
              <CircularProgressbar value={(timeRemaining / 30) * 100} text={`${timeRemaining}s`} />
            </div>
          </Col>
        </Row>
      )}

      <Row>
        <Col xs={12}>
          <Button variant="info" onClick={() => setShowTableSecrets(!showTableSecrets)} className="mb-2">
            {showTableSecrets ? "Hide Secrets" : "Show Secrets"}
          </Button>
          <Table striped bordered hover>
            <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Secret Key</th>
              <th>Timestamp</th>
              <th>Actions</th>
            </tr>
            </thead>
            <tbody>
            {secretKeys.map((key: any, index: number) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{key.name}</td>
                <td>{showTableSecrets ? key.key : "••••••••••••"}</td>
                <td>{key.timestamp}</td>
                <td>
                  <Button variant="primary" onClick={() => handleSetCurrentSecret(key.key, key.name)}>
                    Set as Current
                  </Button>
                </td>
              </tr>
            ))}
            </tbody>
          </Table>
          <Button variant="danger" onClick={handleClearAll} className="mt-2">Clear All Secrets</Button>
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
      </Row>    </Container>
  );
};
