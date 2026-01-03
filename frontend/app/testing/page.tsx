'use client'

const biodata = [
    { id: 1, nama: "Rifal Febiyan" },
    { id: 2, nama: "Dodio" }
];

export default function TestingPage() {

    return (
        <div>
            {biodata.map(item => (
                <p key={item.1}>
            {item.nama}</p>

    ))
}
        </div >
    )


}