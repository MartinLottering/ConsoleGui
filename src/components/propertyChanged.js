function propertyChanged(host, event) {
    const id = event.target.id
    if (!id)
        throw new Error(`All bound elements must have an id`)
    host[id] = event.target.type == 'checkbox'
        ? event.target.checked
        : event.target.value
}

function valuePropertyChanged(host, event) {
    const id = event.target.id
    if (!id)
        throw new Error(`All bound elements must have an id`)
    host.value = event.target.type == 'checkbox'
        ? event.target.checked
        : event.target.value
    dispatch(host, 'changed', { detail: id })
}