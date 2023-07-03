import {useContext, useState} from "react";
import {Navigate} from "react-router-dom";
import {UserContext} from "../UserContext";

export default function LoginPage() {
  const [username,setUsername] = useState('');
  const [password,setPassword] = useState('');
  const [redirect,setRedirect] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const {setUserInfo} = useContext(UserContext);
  async function login(ev) {
    ev.preventDefault();
    const response = await fetch('http://localhost:4000/login', {
      method: 'POST',
      body: JSON.stringify({username, password}),
      headers: {'Content-Type':'application/json'},
      credentials: 'include',
    });
    if (response.ok) {
      response.json().then(userInfo => {
        setUserInfo(userInfo);
        setRedirect(true);
      });
    } else {
      setShowAlert(true);
      setTimeout(() => {
        setShowAlert(false);
      }, 3000);
    }
  }

  if (redirect) {
    return <Navigate to={'/'} />
  }


  return (
    // <form className="login">
    //     <input type="text" placeholder="username" />
    //     <input type="password" placeholder="password" />
    //     <button>Login</button>
    // </form>
    <>
    {showAlert && (
        <div className="alert alert-danger" role="alert">
          Wrong Credentials, Login Failed!
        </div>
      )}
    <div style={{fontFamily:'Roboto',fontSize:'25px',margin:'10px',fontWeight:'bold',textAlign:'center'}}>
    Login Page!
    </div>
    <form onSubmit={login}>
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
          onChange={ev=>setUsername(ev.target.value)}
        />
        <div id="emailHelp" className="form-text">
          We'll never share your email with anyone else.
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
          onChange={ev=>setPassword(ev.target.value)}
        />
      </div>
      <div className="mb-3 form-check">
        <input type="checkbox" className="form-check-input" id="exampleCheck1" />
        <label className="form-check-label" for="exampleCheck1">
          Check me out
        </label>
      </div>
      <button style={{alignItems:'center',width:'100px',justifyContent:'center',marginTop:'18px'}} type="submit" className="btn btn-primary ">
        Login
      </button>
    </form>
    </>
  );
}
