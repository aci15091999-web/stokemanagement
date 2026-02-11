import { db, auth, logoutUser } from './firebase.js';
import { collection, addDoc, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

let products = [], bill = [], subtotal=0;

// --- Logout ---
window.logout = async function(){
    await logoutUser();
    window.location.href = "index.html";
}

// --- Auth + Role Management ---
auth.onAuthStateChanged(async (user)=>{
    if(!user) window.location.href="index.html";
    else{
        // Fetch role
        const usersSnap = await getDocs(collection(db,"users"));
        const currentUser = usersSnap.docs.find(d=>d.data().uid===user.uid).data();
        if(currentUser.role==="staff") document.querySelector("#addProductBox").style.display="none";
        loadProducts();
        loadReports();
    }
});

// --- Product Management ---
window.addProduct = async function(){
    const name = pname.value, price = Number(pprice.value), qty = Number(pqty.value);
    if(!name || !price || !qty){ alert("Fill all fields"); return; }
    await addDoc(collection(db,"products"), {name, price, qty});
    pname.value=pprice.value=pqty.value="";
    loadProducts();
}

async function loadProducts(){
    const snap = await getDocs(collection(db,"products"));
    products=[]; productList.innerHTML=""; billProduct.innerHTML="";
    snap.forEach(docSnap=>{
        const data = docSnap.data(); data.id=docSnap.id; products.push(data);
        productList.innerHTML += `<tr><td>${data.name}</td><td>₹${data.price}</td><td>${data.qty}</td><td><button onclick="deleteProduct('${data.id}')">Delete</button></td></tr>`;
        billProduct.innerHTML += `<option value="${data.id}">${data.name}</option>`;
    });
}

window.deleteProduct = async function(id){
    await updateDoc(doc(db,"products",id), {qty:0});
    loadProducts();
}

// --- Billing ---
window.addToBill = function(){
    const id=billProduct.value, qty=Number(billQty.value);
    const product=products.find(p=>p.id===id);
    if(qty<=0 || product.qty<qty){ alert("Invalid qty"); return; }
    bill.push({name:product.name, qty, price:product.price, amount:product.price*qty});
    updateDoc(doc(db,"products",product.id), {qty:product.qty-qty});
    loadBill(); loadProducts(); billQty.value="";
}

function loadBill(){
    billList.innerHTML=""; subtotal=0;
    bill.forEach(item=>{ billList.innerHTML+=`<tr><td>${item.name}</td><td>${item.qty}</td><td>₹${item.price}</td><td>₹${item.amount}</td></tr>`; subtotal+=item.amount; });
    const cgst=subtotal*0.09, sgst=subtotal*0.09, total=subtotal+cgst+sgst;
    subtotalEl.innerText=subtotal.toFixed(2); cgstEl.innerText=cgst.toFixed(2); sgstEl.innerText=sgst.toFixed(2); totalEl.innerText=total.toFixed(2);
}

window.clearBill=function(){ bill=[]; loadBill(); }

window.printInvoice=function(){
    let invoice="<h1>Invoice</h1><table border='1' style='width:100%;border-collapse:collapse;text-align:center;'><tr><th>Product</th><th>Qty</th><th>Price</th><th>Amount</th></tr>";
    bill.forEach(item=>{ invoice+=`<tr><td>${item.name}</td><td>${item.qty}</td><td>₹${item.price}</td><td>₹${item.amount}</td></tr>` });
    invoice+=`</table><h3>Subtotal: ₹${subtotal.toFixed(2)}</h3><h3>CGST: ₹${(subtotal*0.09).toFixed(2)}</h3><h3>SGST: ₹${(subtotal*0.09).toFixed(2)}</h3><h2>Total: ₹${(subtotal*1.18).toFixed(2)}</h2>`;
    let w=window.open('','', 'height=600,width=800'); w.document.write(invoice); w.document.close(); w.print();
}

// --- Sales Report ---
async function loadReports(){
    const billsSnap = await getDocs(collection(db,"bills"));
    let dailyTotal=0, monthlyTotal=0, today=new Date().toDateString(), currentMonth=new Date().getMonth();
    billsSnap.forEach(docSnap=>{
        const data=docSnap.data();
        const d=new Date(data.timestamp.seconds*1000);
        if(d.toDateString()===today) dailyTotal+=data.total;
        if(d.getMonth()===currentMonth) monthlyTotal+=data.total;
    });
    dailySales.innerText=dailyTotal.toFixed(2); monthlySales.innerText=monthlyTotal.toFixed(2);
}

window.exportReportPDF=function(){
    const { jsPDF }=window.jspdf;
    const doc=new jsPDF();
    doc.text("Sales Report",20,20);
    doc.text("Daily Sales: ₹"+dailySales.innerText,20,40);
    doc.text("Monthly Sales: ₹"+monthlySales.innerText,20,50);
    doc.save("Sales_Report.pdf");
}
