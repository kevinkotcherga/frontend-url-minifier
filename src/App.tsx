import React, { useEffect, useState } from "react";
import "./App.css";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  useMutation,
  useLazyQuery,
  createHttpLink,
  useQuery,
} from "@apollo/client";
import { createUser } from "./graphql/createUser";
import { signin } from "./graphql/signin";
import { me } from "./graphql/me";
import { setContext } from '@apollo/client/link/context';

interface IUser {
  id: number,
  email: string
}

function Signin(props: { onTokenChange: (token: string) => void }) {
  const [email, setEmail] = useState('hello@gmail2.com');
  const [password, setPassword] = useState('12346789');
  const [wrongCredentials, setWrongCredentials] = useState(false);

  const [doSigninMutation, {data, loading, error}] = useMutation(signin);

  // récupérer le token
    async function doSignin(){
      try {
      const { data } = await doSigninMutation({
        variables: {
          email,
          password
        },
      });
      // data.signin = un token "eaz46846az8e46"
      if (data.signin) {
        props.onTokenChange(data.signin);
      } else {
        setWrongCredentials(true);
      }
    } catch {}
  }

  return (
    <>
    <h1>Signin</h1>
    {wrongCredentials === true && <p>Identifiant ou mot de passe incorrect</p>}
    {loading && <p>Chargement..</p>}
    {error && <pre style={{color: "red"}}>{JSON.stringify(error, null, 4)}</pre>}
    <p>Email :</p>
    <input disabled={loading} type="email" value={email} onChange={e => setEmail(e.target.value)} />
    <p>Mot de passe :</p>
    <input disabled={loading} type="password" value={password} onChange={e => setPassword(e.target.value)}/>
    <button disabled={loading} onClick={doSignin}>Se connecter</button>
    </>
  );
}

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [doSignupMutation, {data, loading, error}] = useMutation(createUser);

  async function doSignup(){
    try {
    await doSignupMutation({
      variables: {
        data: {
          email,
          password
        },
      },
    });
    setEmail('');
    setPassword('');
  } catch {}
}

  return (
    <>
    <h1>Signup</h1>
    {error && <pre style={{color: "red"}}>{JSON.stringify(error, null, 4)}</pre>}
    <p>Email :</p>
    <input disabled={loading} type="email" value={email} onChange={e => setEmail(e.target.value)} />
    <p>Mot de passe :</p>
    <input disabled={loading} type="password" value={password} onChange={e => setPassword(e.target.value)}/>
    <button disabled={loading} onClick={doSignup}>S'inscrire</button>
    </>
  );
}

function Dashboard(props: {user: IUser, onTokenChange: (token?: string) => void}){
  return <>
    <h1>Dashboard</h1>
    <p>Hello {props.user.email}</p>
    <button onClick={() => {
      props.onTokenChange();
    }}>Déconnexion</button>
  </>
}

function Main() {
  const [user, setUser] = useState<IUser | null |undefined>(undefined);

  const { data, refetch } = useQuery(me);

  useEffect(() => {
      if(data) {
        if (data.me) {
          setUser(data.me);
        } else {
          setUser(null);
        }
      }
  }, [data]);

  function onTokenChange(token?: string) {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem("token");
    }
    refetch();
  }

  return (
    <div>
      {user ? (
        <Dashboard user={user} onTokenChange={onTokenChange}/>
      ) : user === null ? (
        <>
          <Signup />
          <hr />
          <Signin onTokenChange={onTokenChange}/>
        </>
      ) : <p>Chargement..</p>}
    </div>
  );
}

const httpLink = createHttpLink({
  uri: 'http://localhost:5000',
});

const authLink = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
  const token = localStorage.getItem('token');
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache()
});

function App() {
  return (
    <ApolloProvider client={client}>
      <Main />
    </ApolloProvider>
  );
}

export default App;
