export const validation = {
  firstname: {
    presence: {
      message: '^The First Name field cannot be empty.'
    },
    length: {
      maximum: 20,
      message: "must be less than 20 characters"
    },
    length: {
      minimum: 1,
      message: "^The First Name field cannot be empty."
    },
  },

  lastname: {
    presence: {
      message: '^The Last Name field cannot be empty.'
    },
    length: {
      maximum: 20,
      message: "must be less than 20 characters"
    },
    length: {
      minimum: 1,
      message: "^The Last Name field cannot be empty."
    },
  },

  email: {
    presence: {
      message: '^The Email cannot be empty.'
    },
    format: {
      pattern: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      message: '^Please enter a valid email address'
    },
    length: {
      minimum: 1,
      message: "^The Email cannot be empty."
    },
  },
    
  password: {
    presence: {
      message: '^Please enter a password'
    },
    length: {
      minimum: 5,
      message: '^Your password must be at least 5 characters'
    },
    length: {
      minimum: 1,
      message: "^Please enter a password"
    },
  }
}