const firebaseUIConfig = {
    signInOptions: [
      {
        provider: 'password',
        requireDisplayName: false,
      },
    ],
    signInSuccessUrl: '/finish-signup', 
  };
  
  export default firebaseUIConfig;