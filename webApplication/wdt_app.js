// Employee
class Employee {
  constructor(name, surname) {
    this.name = name;
    this.surname = surname;
  }
}

// Staff
class Staff extends Employee {
  constructor(id, picture, name, surname, email) {
    super(name, surname);
    this.id = id;
    this.picture = picture;
    this.email = email;
    this.status = "In";
  }

  clockIn() {
    this.status = "In";
    this.outTime = null;
    this.duration = null;
    this.expectedReturnTime = null;
  }

  clockOut(timeInMinutes) {
    const duration = this.toHoursAndMinutes(timeInMinutes);
    const now = new Date();
    const expectedReturnTime = this.addMinutes(timeInMinutes);

    this.status = "Out";
    this.outTime = now;
    this.duration = duration;
    this.expectedReturnTime = expectedReturnTime;
  }

  staffMemberIsLate() {
    const now = new Date();
    return now > this.expectedReturnTime;
  }

  addMinutes(totalMinutes) {
    const date = new Date();
    date.setMinutes(date.getMinutes() + totalMinutes);

    return date;
  }

  toHoursAndMinutes(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours} hr ${minutes} min`;
  }
}

// Delivery
class Delivery extends Employee {
  constructor(vehicle, name, surname, telephone, deliverAddress, returnTime) {
    super(name, surname);
    this.id = crypto.randomUUID();
    this.vehicle = vehicle;
    this.telephone = telephone;
    this.deliverAddress = deliverAddress;
    this.returnTime = returnTime;
  }

  dismissed() {
    this.isDismissed = true;
  }
}

// Format datetime to HH:MM.
const formatDateTime = (date) => {
  return new Intl.DateTimeFormat("nb-NO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

// Deliveries
let selectedDeliveryId = null;
let deliveries = [];

const setSelectedDeliveryRow = (row, id) => {
  const selected = $(row).hasClass("table-info");
  // Remove selected class from any other row
  $("#delivery-table tr").removeClass("table-info");

  if (!selected) {
    $(row).addClass("table-info");
    selectedDeliveryId = id;
  } else {
    selectedDeliveryId = null;
  }
};

const addDeliveryTableRow = (deliveryId) => {
  const table = document
    .getElementById("delivery-table")
    .getElementsByTagName("tbody")[0];
  const row = table.insertRow();
  const delivery = deliveries.find((d) => d.id === deliveryId);

  if (!delivery) {
    return;
  }

  const vehicle =
    delivery.vehicle === "Motorcycle"
      ? '<i class="fa fa-motorcycle" aria-hidden="true"></i>'
      : '<i class="fa fa-car" aria-hidden="true"></i>';

  row.id = delivery.id;
  row.insertCell(0).innerHTML = vehicle;
  row.insertCell(1).innerHTML = delivery.name;
  row.insertCell(2).innerHTML = delivery.surname;
  row.insertCell(3).innerHTML = delivery.telephone;
  row.insertCell(4).innerHTML = delivery.deliverAddress;
  row.insertCell(5).innerHTML = delivery.returnTime
    ? formatDateTime(delivery.returnTime)
    : "";
  row.onclick = function () {
    setSelectedDeliveryRow($(this), delivery.id);
  };

  $("#delivery-table tr").removeClass("table-info");
};

const validateDelivery = (data) => {
  const vehicle = data.get("vehicle");

  if (!vehicle) {
    alert("Missing vehicle type");

    return false;
  }

  if (vehicle !== "Motorcycle" && vehicle !== "Car") {
    alert("Vehicle must be 'Motorcycle' or 'Car'");

    return false;
  }

  if (!data.get("name")) {
    alert("Missing name");
    return false;
  }

  if (!data.get("surname")) {
    alert("Missing surname");
    return false;
  }

  if (!data.get("driverAddress")) {
    alert("Missing driver address");
    return false;
  }

  if (data.get("telephone").split("-").join("").length !== 8) {
    alert("Invalid telephone number");
    return false;
  }

  if (!data.get("returnTime")) {
    alert("Missing return time");
    return false;
  }

  return true;
};

const addDelivery = (e) => {
  e.preventDefault();

  const form = document.getElementById("add-delivery-form");

  const data = new FormData(form);

  if (!validateDelivery(data)) {
    return;
  }

  const vehicle = data.get("vehicle");
  const name = data.get("name");
  const surname = data.get("surname");
  const telephone = data.get("telephone");
  const driverAddress = data.get("driverAddress");
  const returnTime = data.get("returnTime");

  const now = new Date();
  const hoursAndMinutes = returnTime.split(":");
  now.setHours(+hoursAndMinutes[0], +hoursAndMinutes[1], 0, 0);

  const newDelivery = new Delivery(
    vehicle,
    name,
    surname,
    telephone,
    driverAddress,
    now
  );

  deliveries.push(newDelivery);
  addDeliveryTableRow(newDelivery.id);

  form.reset();

  selectedDeliveryId = null;
};

const clearDelivery = () => {
  if (!selectedDeliveryId) {
    return alert("Can't clear a delivery when no delivery is selected");
  }

  deliveries = deliveries.filter(
    (delivery) => delivery.id !== selectedDeliveryId
  );

  var row = document.getElementById(selectedDeliveryId);
  row.parentNode.removeChild(row);

  selectedDeliveryId = null;
};

const digitalClock = () => {
  const date = new Date();

  const formattedTime = new Intl.DateTimeFormat("nb-NO", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).format(date);

  document.getElementById("live-clock").innerHTML = formattedTime;
};

const showDeliveryToaster = (delivery) => {
  const toaster = document.getElementById("my-toast");
  toaster.querySelector(
    ".toast-header"
  ).innerHTML = `<div>${delivery.name} is running late!</div>`;

  toaster.querySelector(".toast-body").innerHTML = `   
  <div>
    <div>Name: ${delivery.name}</div>
    <div>Surname: ${delivery.surname}</div>
    <div>Telephone: ${delivery.telephone}</div>
    <div>Estimated return time: ${formatDateTime(delivery.returnTime)}</div>
    <div>Address: ${delivery.deliverAddress}</div>
  </div>
`;

  const visibleToast = new bootstrap.Toast(toaster);
  visibleToast.show();
};

const checkDeliveries = () => {
  const now = new Date();

  for (const delivery of deliveries) {
    if (delivery.returnTime < now && !delivery?.isDismissed) {
      showDeliveryToaster(delivery);
      delivery.dismissed();
      console.log(delivery);
    }
  }
};

// Staffs
let selectedStaffId = null;
let staffList = [];

const getTableCellForRow = (rowId, tableId) => {
  const table = document.getElementById(tableId);
  const tableRow = table.rows.namedItem(rowId);
  const tableCells = tableRow.cells;

  return tableCells;
};

const setSelectedStaffRow = (row, id) => {
  const selected = $(row).hasClass("table-info");
  // Remove selected class from any other row
  $("#staff-table tr").removeClass("table-info");

  if (!selected) {
    $(row).addClass("table-info");
    selectedStaffId = id;
  } else {
    selectedStaffId = null;
  }
};

const createStaffTable = () => {
  const table = document
    .getElementById("staff-table")
    .getElementsByTagName("tbody")[0];

  for (let index = 0; index < staffList.length; index++) {
    var row = table.insertRow();
    const staff = staffList[index];

    row.id = staff.id;
    row.insertCell(
      0
    ).innerHTML = `<img src='${staff.picture}' alt='${staff.name}'/>`;
    row.insertCell(1).innerHTML = staff.name;
    row.insertCell(2).innerHTML = staff.surname;
    row.insertCell(3).innerHTML = staff.email;
    row.insertCell(4).innerHTML = staff?.status ?? "";
    row.insertCell(5).innerHTML = staff?.outTime ?? "";
    row.insertCell(6).innerHTML = staff?.duration ?? "";
    row.insertCell(7).innerHTML = staff?.expectedReturnTime ?? "";
    row.onclick = function () {
      setSelectedStaffRow($(this), staff.id);
    };
  }
};

const updateStaffTableRow = (rowId) => {
  const tableCells = getTableCellForRow(rowId, "staff-table");
  const staff = staffList.find((e) => e.id === rowId);

  if (!staff) {
    return;
  }

  tableCells[4].innerHTML = staff.status;
  tableCells[5].innerHTML = staff.outTime ? formatDateTime(staff.outTime) : "";
  tableCells[6].innerHTML = staff.duration ?? "";
  tableCells[7].innerHTML = staff.expectedReturnTime
    ? formatDateTime(staff.expectedReturnTime)
    : "";

  $("#staff-table tr").removeClass("table-info");

  // Reset selected employeeId
  selectedStaffId = null;
};

const showStaffToaster = (staff) => {
  const toaster = document.getElementById("my-toast");
  toaster.querySelector(
    ".toast-header"
  ).innerHTML = `<div>${staff.name} is running late.</div>`;

  toaster.querySelector(".toast-body").innerHTML = `   
  <div>
    <img src='${staff.picture}' alt='${staff.name}'/>
    <div>Name: ${staff.name}</div>
    <div>Surname: ${staff.surname}</div>
    <div>Duration: ${staff.duration}</div>
  </div>
`;

  const visibleToast = new bootstrap.Toast(toaster);
  visibleToast.show();
};

const clockIn = () => {
  if (!selectedStaffId) {
    return alert("Choose an employee to clock in");
  }

  for (const staff of staffList) {
    if (staff.id === selectedStaffId) {
      showStaffToaster(staff);

      if (staff.staffMemberIsLate()) {
      }

      staff.clockIn();
    }
  }

  updateStaffTableRow(selectedStaffId);
};

const clockOut = () => {
  if (!selectedStaffId) {
    return alert("Select a employee to clock out");
  }

  const timeInMinutes = +prompt("How many minutes?");

  for (const staff of staffList) {
    if (staff.id === selectedStaffId) {
      staff.clockOut(timeInMinutes);
    }
  }

  updateStaffTableRow(selectedStaffId);
};

const staffUserGet = async () => {
  for (let index = 0; index < 5; index++) {
    const response = await fetch("https://randomuser.me/api/");
    const json = await response.json();
    const result = json.results?.[0];

    const user = new Staff(
      result.login.uuid,
      result.picture.thumbnail,
      result.name.first,
      result.name.last,
      result.email
    );

    staffList.push(user);
  }
};

// Setup for deliveries
document.getElementById("add-delivery").addEventListener("click", addDelivery);
document
  .getElementById("clear-delivery")
  .addEventListener("click", clearDelivery);

setInterval(checkDeliveries, 1000);
setInterval(digitalClock, 1000);

// Setup for staff
document.getElementById("clock-in-staff").addEventListener("click", clockIn);
document.getElementById("clock-out-staff").addEventListener("click", clockOut);

await staffUserGet();

createStaffTable();

// Dismiss toaster function
$("#toast-dismiss").click(function () {
  $("#my-toast").toast("hide");
});
