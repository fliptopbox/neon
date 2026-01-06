(async function () {
    console.log(222222);
    const users = await fetch('/v_users.json')
        .then(res => res.json())
    console.log(users);

    Array.from(document.querySelectorAll('[unique]'))
        .forEach(el => el.onblur = (e) => {
            const value = e.target.value;
            const exists = users.some(user => user[el.id] === value);
            el.classList.remove('invalid');
            if (exists) el.classList.add('invalid');
            console.log(exists, el.id, value);
        })
})();