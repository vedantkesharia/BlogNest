import { useState,useEffect } from "react";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [showAlert2, setShowAlert2] = useState(false);
  async function register(ev) {
    ev.preventDefault();
    const response = await fetch("https://blognest-3c22.onrender.com/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      headers: { "Content-Type": "application/json" },
    });
    if (response.status === 200) {
      setShowAlert(true);
      setTimeout(() => {
        setShowAlert(false);
      }, 3000);
    } else {
      setShowAlert2(true);
      setTimeout(() => {
        setShowAlert2(false);
      }, 3000);
      // alert("registration failed");
    }
  }
  return (
    <>
    {showAlert && (
        <div className="alert alert-success " role="alert">
          Registered Successfully!
        </div>
      )}
      {showAlert2 && (
        <div className="alert alert-danger" role="alert">
          Registration Failed!
        </div>
      )}
      <div
        style={{
          fontFamily: "Roboto",
          fontSize: "25px",
          margin: "10px",
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        Register Here!
      </div>
      
      <form onSubmit={register}>
        <div className="mb-3">
          <label for="exampleInputEmail1" className="form-label">
            Username
          </label>
          <input
            type="text"
            className="form-control"
            id="exampleInputEmail1"
            aria-describedby="emailHelp"
            value={username}
            onChange={(ev) => setUsername(ev.target.value)}
            minLength={4}
          required
          />
          <div id="emailHelp" className="form-text">
            We'll never share your username with anyone else.
          </div>
        </div>
        <div className="mb-3">
          <label for="exampleInputPassword1" className="form-label">
            Password
          </label>
          <input
            type="password"
            className="form-control"
            id="exampleInputPassword1"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            minLength={4}
          required
          />
        </div>
        {/* <div className="mb-3 form-check">
          <input
            type="checkbox"
            className="form-check-input"
            // id="exampleCheck1"
          />
          <label className="form-check-label" for="exampleCheck1">
            Check me out
          </label>
        </div> */}
        <button
          style={{
            alignItems: "center",
            width: "100px",
            justifyContent: "center",
            marginTop: "18px",
          }}
          type="submit"
          className="btn btn-primary "
        >
          Register
        </button>
      </form>
    </>
  );
}
