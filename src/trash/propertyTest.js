const customer = {
  firstName: 'Martin',
  lastName: 'Lottering',
  name: {
    get: ({ firstName, lastName }) => `${firstName} ${lastName}`,
    set: _ => {
      console.log('setting property')
    }
  }
}

customer.name = 'hello'
