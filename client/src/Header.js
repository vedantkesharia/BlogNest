import {Link,useNavigate} from "react-router-dom";
import {useContext, useEffect, useState} from "react";
import {UserContext} from "./UserContext";
export default function Header(){
  const navigate = useNavigate();

  const handleCreatePost = () => {
    navigate("/create");
  };
  const {setUserInfo,userInfo} = useContext(UserContext);
  // const [username,setUsername] = useState(null);
  useEffect(() => {
    fetch('http://localhost:4000/profile', {
      credentials: 'include',
    }).then(response => {
      response.json().then(userInfo => {
        setUserInfo(userInfo);
      });
    });
  }, []);

  function logout() {
    fetch('http://localhost:4000/logout', {
      credentials: 'include',
      method: 'POST',
    });
    setUserInfo(null);

  }

  const username = userInfo?.username;

    return(
        <header>
        <Link to="/" className="logo">BlogNest</Link>
        <nav>
          {username && (
            <>
            <Link to="/create" className="btn btn-primary ">Create new post</Link>
            {/* <button type="button" className="btn btn-primary" onClick={handleCreatePost}>Create new post</button>
            <button type="button" className="btn btn-primary" onClick={logout}>Logout </button> */}
            <a className="btn btn-primary " onClick={logout}>Logout</a>
            </>
          )}
          {!username && (
            <>
            <Link to="/login" className="btn btn-primary">Login</Link>
          <Link to="/register" className="btn btn-primary">Register</Link>
            </>
          )}
          
        </nav>
      </header>
         )
        }
//     <>
//     <nav class="navbar navbar-expand-lg bg-body-tertiary">
//   <div class="container-fluid">
//     <a class="navbar-brand" href="#">Navbar</a>
//     <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
//       <span class="navbar-toggler-icon"></span>
//     </button>
//     <div class="collapse navbar-collapse" id="navbarSupportedContent">
//       <ul class="navbar-nav me-auto mb-2 mb-lg-0">
//         <li class="nav-item">
//           <a class="nav-link active" aria-current="page" href="#">Home</a>
//         </li>
//         <li class="nav-item">
//           <a class="nav-link" href="#">Link</a>
//         </li>
//         <li class="nav-item dropdown">
//           <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
//             Dropdown
//           </a>
//           <ul class="dropdown-menu">
//             <li><a class="dropdown-item" href="#">Action</a></li>
//             <li><a class="dropdown-item" href="#">Another action</a></li>
//             <li><hr class="dropdown-divider"/></li>
//             <li><a class="dropdown-item" href="#">Something else here</a></li>
//           </ul>
//         </li>
//         <li class="nav-item">
//           <a class="nav-link disabled">Disabled</a>
//         </li>
//       </ul>
//       <form class="d-flex" role="search">
//         <input class="form-control me-2" type="search" placeholder="Search" aria-label="Search"/>
//         <button class="btn btn-outline-success" type="submit">Search</button>
//       </form>
//     </div>
//   </div>
// </nav>
    
//     </>
 