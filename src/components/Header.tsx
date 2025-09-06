import React from 'react';
import { Container, Nav, Navbar, NavDropdown } from "react-bootstrap";

export const Header: React.FC = () => {
  return (
    <Navbar bg="light" expand="lg" className="shadow-sm">
      <Container>
        <Navbar.Brand href='#' data-testid="logo" className="fw-bold">
          QA Utils
        </Navbar.Brand>
        <Navbar.Toggle 
          aria-controls="basic-navbar-nav" 
          aria-label="Toggle navigation"
        />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link href="#/" aria-label="Go to home page">
              🏠 Home
            </Nav.Link>
            <NavDropdown 
              title="💡 Hints" 
              id="nav-dropdown-hints"
              aria-label="Hints menu"
            >
              <NavDropdown.Item href="#/codeceptjs">
                🔥💡 CodeceptJS Hint
              </NavDropdown.Item>
            </NavDropdown>
            <NavDropdown 
              title="📚 Terms" 
              id="nav-dropdown-terms"
              aria-label="Terms menu"
            >
              <NavDropdown.Item href="#/ivr">
                Interactive Voice Response (IVR)
              </NavDropdown.Item>
              <NavDropdown.Item href="#/blf">
                Busy Lamp Field (BLF)
              </NavDropdown.Item>
              <NavDropdown.Item href="#/sip">
                Session Initiation Protocol (SIP)
              </NavDropdown.Item>
            </NavDropdown>
            <NavDropdown 
              title="🛠️ Utils" 
              id="nav-dropdown-utils"
              aria-label="Utilities menu"
            >
              <NavDropdown.Item href="#/jwtDebugger">
                🌐 JWT Debugger
              </NavDropdown.Item>
              <NavDropdown.Item href="#/base64">
                🛸 Base64 Encode/Decode
              </NavDropdown.Item>
              <NavDropdown.Item href="#/timestamp">
                ⏰ Unix Timestamp Converter
              </NavDropdown.Item>
              <NavDropdown.Item href="#/jsonFormatter">
                ﹛ JSON Formatter ﹜
              </NavDropdown.Item>
              <NavDropdown.Item href="#/uuid">
                🌠 UUID Generator
              </NavDropdown.Item>
              <NavDropdown.Item href="#/jiraComment">
                🌠 JIRA Comment Generator
              </NavDropdown.Item>
              <NavDropdown.Item href="#/otp">
                🌠 OTP Generator
              </NavDropdown.Item>
              <NavDropdown.Item href="#/encryption">
                🔐 Encryption/Decryption Tool
              </NavDropdown.Item>
              <NavDropdown.Item href="#/playwright2codecept">
                🤖 Playwright Tests to CodeceptJS
              </NavDropdown.Item>
            </NavDropdown>
            <NavDropdown 
              title="📚 ISTQB" 
              id="istqb"
              aria-label="ISTQB menu"
            >
              <NavDropdown.Item href="#/ctfl">
                📚 CTFL v4 - Practice Exams
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}
