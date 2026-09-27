function Dashboard({user,setUser}) {
    console.log(user);
    return (
        <div className="text-black">
            {user.name}
        </div>
    )
}

export default Dashboard