import ReactQuill from "react-quill";
import 'react-quill/dist/quill.snow.css';
import {useState} from "react";
import {Navigate} from "react-router-dom";
import Editor from "../Editor";

export default function CreatePost() {
  const [title,setTitle] = useState('');
  const [summary,setSummary] = useState('');
  const [content,setContent] = useState('');
  const [files, setFiles] = useState('');
  const [redirect, setRedirect] = useState(false);
  async function createNewPost(ev) {
    const data = new FormData();
    data.append('title', title);
    data.append('summary', summary);
    data.append('content', content);
    data.append('file', files[0]);
    ev.preventDefault();
  
    
      const response = await fetch('https://blognest-6a91.onrender.com/post', {
        method: 'POST',
        body: data,
        credentials: 'include',
      });
  
      if (response.ok) {
        setRedirect(true);
      } 
    }
  

  if (redirect) {
    return <Navigate to={'/'} />
  }
  return (
    <form onSubmit={createNewPost} encType="multipart/form-data">
      <input className="createpost" type="title"
             placeholder={'Title'}
             value={title}
             
             onChange={ev => setTitle(ev.target.value)} required/>
      <input className="createpost" type="summary"
             placeholder={'Summary'}
             value={summary}
             onChange={ev => setSummary(ev.target.value)} required/>
      <input className="createpost" type="file" name="file"
             onChange={ev => setFiles(ev.target.files)} required/>
      <Editor value={content} onChange={setContent} />
      <button className="createbutton" style={{marginTop:'5px'}}>Create post</button>
    </form>
  );
}