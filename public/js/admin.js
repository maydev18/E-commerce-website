const deleteProduct = (btn) => {
    const prodId = btn.parentNode.querySelector('[name=id]').value;
    console.log(prodId);
    const elem = btn.parentNode.parentNode;
    if(window.confirm("are you sure ?")){
        fetch(`/admin/product/${prodId}` , {
            method : "DELETE",
        })
        .then(result => {
            return result.json();
        })
        .then(data => {
            elem.remove();
        })
        .catch(err => {
            console.log(err);
        })
    }
};  