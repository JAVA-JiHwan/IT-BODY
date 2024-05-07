(function ($) {
  "use strict";

  // Spinner
  var spinner = function () {
    setTimeout(function () {
      if ($("#spinner").length > 0) {
        $("#spinner").removeClass("show");
      }
    }, 1);
  };
  spinner();

  // Initiate the wowjs
  new WOW().init();

  // Sticky Navbar
  $(window).scroll(function () {
    if ($(this).scrollTop() > 45) {
      $(".navbar").addClass("sticky-top shadow-sm");
    } else {
      $(".navbar").removeClass("sticky-top shadow-sm");
    }
  });

  // Dropdown on mouse hover
  const $dropdown = $(".dropdown");
  const $dropdownToggle = $(".dropdown-toggle");
  const $dropdownMenu = $(".dropdown-menu");
  const showClass = "show";

  $(window).on("load resize", function () {
    if (this.matchMedia("(min-width: 992px)").matches) {
      $dropdown.hover(
        function () {
          const $this = $(this);
          $this.addClass(showClass);
          $this.find($dropdownToggle).attr("aria-expanded", "true");
          $this.find($dropdownMenu).addClass(showClass);
        },
        function () {
          const $this = $(this);
          $this.removeClass(showClass);
          $this.find($dropdownToggle).attr("aria-expanded", "false");
          $this.find($dropdownMenu).removeClass(showClass);
        }
      );
    } else {
      $dropdown.off("mouseenter mouseleave");
    }
  });

  // Facts counter
  $('[data-toggle="counter-up"]').counterUp({
    delay: 10,
    time: 2000,
  });

  // Back to top button
  $(window).scroll(function () {
    if ($(this).scrollTop() > 100) {
      $(".back-to-top").fadeIn("slow");
    } else {
      $(".back-to-top").fadeOut("slow");
    }
  });
  $(".back-to-top").click(function () {
    $("html, body").animate({ scrollTop: 0 }, 1500, "easeInOutExpo");
    return false;
  });

  // Testimonials carousel
  $(".testimonial-carousel").owlCarousel({
    autoplay: true,
    smartSpeed: 1500,
    dots: true,
    loop: true,
    center: true,
    responsive: {
      0: {
        items: 1,
      },
      576: {
        items: 1,
      },
      768: {
        items: 2,
      },
      992: {
        items: 3,
      },
    },
  });

  // Vendor carousel
  $(".vendor-carousel").owlCarousel({
    loop: true,
    margin: 45,
    dots: false,
    loop: true,
    autoplay: true,
    smartSpeed: 1000,
    responsive: {
      0: {
        items: 2,
      },
      576: {
        items: 4,
      },
      768: {
        items: 6,
      },
      992: {
        items: 8,
      },
    },
  });
})(jQuery);

var draggedEventIsAllDay;
var activeInactiveWeekends = true;

var calendar = $("#calendar").fullCalendar({
  /** ******************
   *  OPTIONS
   * *******************/
  locale: "ko",
  timezone: "local",
  nextDayThreshold: "09:00:00",
  allDaySlot: true,
  displayEventTime: true,
  displayEventEnd: true,
  firstDay: 0, //월요일이 먼저 오게 하려면 1
  weekNumbers: false,
  selectable: true,
  weekNumberCalculation: "ISO",
  eventLimit: true,
  views: {
    month: { eventLimit: 12 }, // 한 날짜에 최대 이벤트 12개, 나머지는 + 처리됨
  },
  eventLimitClick: "week", //popover
  navLinks: true,
  defaultDate: moment("2024-05"), //실제 사용시 현재 날짜로 수정
  timeFormat: "HH:mm",
  defaultTimedEventDuration: "01:00:00",
  editable: true,
  minTime: "00:00:00",
  maxTime: "24:00:00",
  slotLabelFormat: "HH:mm",
  weekends: true,
  nowIndicator: true,
  dayPopoverFormat: "MM/DD dddd",
  longPressDelay: 0,
  eventLongPressDelay: 0,
  selectLongPressDelay: 0,
  header: {
    left: "today, prevYear, nextYear, viewWeekends",
    center: "prev, title, next",
    right: "month, agendaWeek, agendaDay, listWeek",
  },
  views: {
    month: {
      columnFormat: "dddd",
    },
    agendaWeek: {
      columnFormat: "M/D ddd",
      titleFormat: "YYYY년 M월 D일",
      eventLimit: false,
    },
    agendaDay: {
      columnFormat: "dddd",
      eventLimit: false,
    },
    listWeek: {
      columnFormat: "",
    },
  },
  customButtons: {
    //주말 숨기기 & 보이기 버튼
    viewWeekends: {
      text: "주말",
      click: function () {
        activeInactiveWeekends
          ? (activeInactiveWeekends = false)
          : (activeInactiveWeekends = true);
        $("#calendar").fullCalendar("option", {
          weekends: activeInactiveWeekends,
        });
      },
    },
  },

  eventRender: function (event, element, view) {
    //일정에 hover시 요약
    element.popover({
      title: $("<div />", {
        class: "popoverTitleCalendar",
        text: event.title,
      }).css({
        background: event.backgroundColor,
        color: event.textColor,
      }),
      content: $("<div />", {
        class: "popoverInfoCalendar",
      })
        .append("<p><strong>등록자:</strong> " + event.username + "</p>")
        .append("<p><strong>구분:</strong> " + event.type + "</p>")
        .append(
          "<p><strong>시간:</strong> " + getDisplayEventDate(event) + "</p>"
        )
        .append(
          '<div class="popoverDescCalendar"><strong>설명:</strong> ' +
            event.description +
            "</div>"
        ),
      delay: {
        show: "800",
        hide: "50",
      },
      trigger: "hover",
      placement: "top",
      html: true,
      container: "body",
    });

    return filtering(event);
  },

  /* ****************
   *  일정 받아옴
   * ************** */
  events: function (start, end, timezone, callback) {
    $.ajax({
      type: "get",
      url: "data.json",
      data: {
        // 화면이 바뀌면 Date 객체인 start, end 가 들어옴
        //startDate : moment(start).format('YYYY-MM-DD'),
        //endDate   : moment(end).format('YYYY-MM-DD')
      },
      success: function (response) {
        var fixedDate = response.map(function (array) {
          if (array.allDay && array.start !== array.end) {
            array.end = moment(array.end).add(1, "days"); // 이틀 이상 AllDay 일정인 경우 달력에 표기시 하루를 더해야 정상출력
          }
          return array;
        });
        callback(fixedDate);
      },
    });
  },

  eventAfterAllRender: function (view) {
    if (view.name == "month") $(".fc-content").css("height", "auto");
  },

  //일정 리사이즈
  eventResize: function (event, delta, revertFunc, jsEvent, ui, view) {
    $(".popover.fade.top").remove();

    /** 리사이즈시 수정된 날짜반영
     * 하루를 빼야 정상적으로 반영됨. */
    var newDates = calDateWhenResize(event);

    //리사이즈한 일정 업데이트
    $.ajax({
      type: "get",
      url: "",
      data: {
        //id: event._id,
        //....
      },
      success: function (response) {
        alert("수정: " + newDates.startDate + " ~ " + newDates.endDate);
      },
    });
  },

  eventDragStart: function (event, jsEvent, ui, view) {
    draggedEventIsAllDay = event.allDay;
  },

  //일정 드래그앤드롭
  eventDrop: function (event, delta, revertFunc, jsEvent, ui, view) {
    $(".popover.fade.top").remove();

    //주,일 view일때 종일 <-> 시간 변경불가
    if (view.type === "agendaWeek" || view.type === "agendaDay") {
      if (draggedEventIsAllDay !== event.allDay) {
        alert("드래그앤드롭으로 종일<->시간 변경은 불가합니다.");
        location.reload();
        return false;
      }
    }

    // 드랍시 수정된 날짜반영
    var newDates = calDateWhenDragnDrop(event);

    //드롭한 일정 업데이트
    $.ajax({
      type: "get",
      url: "",
      data: {
        //...
      },
      success: function (response) {
        alert("수정: " + newDates.startDate + " ~ " + newDates.endDate);
      },
    });
  },

  select: function (startDate, endDate, jsEvent, view) {
    $(".fc-body").unbind("click");
    $(".fc-body").on("click", "td", function (e) {
      $("#contextMenu").addClass("contextOpened").css({
        display: "block",
        left: e.pageX,
        top: e.pageY,
      });
      return false;
    });

    var today = moment();

    if (view.name == "month") {
      startDate.set({
        hours: today.hours(),
        minute: today.minutes(),
      });
      startDate = moment(startDate).format("YYYY-MM-DD HH:mm");
      endDate = moment(endDate).subtract(1, "days");

      endDate.set({
        hours: today.hours() + 1,
        minute: today.minutes(),
      });
      endDate = moment(endDate).format("YYYY-MM-DD HH:mm");
    } else {
      startDate = moment(startDate).format("YYYY-MM-DD HH:mm");
      endDate = moment(endDate).format("YYYY-MM-DD HH:mm");
    }

    //날짜 클릭시 카테고리 선택메뉴
    var $contextMenu = $("#contextMenu");
    $contextMenu.on("click", "a", function (e) {
      e.preventDefault();

      //닫기 버튼이 아닐때
      if ($(this).data().role !== "close") {
        newEvent(startDate, endDate, $(this).html());
      }

      $contextMenu.removeClass("contextOpened");
      $contextMenu.hide();
    });

    $("body").on("click", function () {
      $contextMenu.removeClass("contextOpened");
      $contextMenu.hide();
    });
  },

  //이벤트 클릭시 수정이벤트
  eventClick: function (event, jsEvent, view) {
    editEvent(event);
  },
});

function getDisplayEventDate(event) {
  var displayEventDate;

  if (event.allDay == false) {
    var startTimeEventInfo = moment(event.start).format("HH:mm");
    var endTimeEventInfo = moment(event.end).format("HH:mm");
    displayEventDate = startTimeEventInfo + " - " + endTimeEventInfo;
  } else {
    displayEventDate = "하루종일";
  }

  return displayEventDate;
}

function filtering(event) {
  var show_username = true;
  var show_type = true;

  var username = $("input:checkbox.filter:checked")
    .map(function () {
      return $(this).val();
    })
    .get();
  var types = $("#type_filter").val();

  show_username = username.indexOf(event.username) >= 0;

  if (types && types.length > 0) {
    if (types[0] == "all") {
      show_type = true;
    } else {
      show_type = types.indexOf(event.type) >= 0;
    }
  }

  return show_username && show_type;
}

function calDateWhenResize(event) {
  var newDates = {
    startDate: "",
    endDate: "",
  };

  if (event.allDay) {
    newDates.startDate = moment(event.start._d).format("YYYY-MM-DD");
    newDates.endDate = moment(event.end._d)
      .subtract(1, "days")
      .format("YYYY-MM-DD");
  } else {
    newDates.startDate = moment(event.start._d).format("YYYY-MM-DD HH:mm");
    newDates.endDate = moment(event.end._d).format("YYYY-MM-DD HH:mm");
  }

  return newDates;
}

function calDateWhenDragnDrop(event) {
  // 드랍시 수정된 날짜반영
  var newDates = {
    startDate: "",
    endDate: "",
  };

  // 날짜 & 시간이 모두 같은 경우
  if (!event.end) {
    event.end = event.start;
  }

  //하루짜리 all day
  if (event.allDay && event.end === event.start) {
    console.log("1111");
    newDates.startDate = moment(event.start._d).format("YYYY-MM-DD");
    newDates.endDate = newDates.startDate;
  }

  //2일이상 all day
  else if (event.allDay && event.end !== null) {
    newDates.startDate = moment(event.start._d).format("YYYY-MM-DD");
    newDates.endDate = moment(event.end._d)
      .subtract(1, "days")
      .format("YYYY-MM-DD");
  }

  //all day가 아님
  else if (!event.allDay) {
    newDates.startDate = moment(event.start._d).format("YYYY-MM-DD HH:mm");
    newDates.endDate = moment(event.end._d).format("YYYY-MM-DD HH:mm");
  }

  return newDates;
}
/* LOGIN V2 - MAIN.JS - dp 2017 */

/*
Got a kind request for a simpler version of the original, Ok.
So I came up with this. Slightly different animation settings.
This is still technically a prototype but it is fully functional as-is.
There is a (height) overflow issue on the smallest of smartphone viewports,
where the bottom may get cut off. I just need to get that sorted and it'll be ready.
*/

// LOGIN TABS
$(function () {
  tab = $(".tabs h3 a");
  tab.on("click", function (event) {
    event.preventDefault();
    tab.removeClass("active");
    $(this).addClass("active");
    tab_content = $(this).attr("href");
    $('div[id$="tab-content"]').removeClass("active");
    $(tab_content).addClass("active");
  });
});

// SLIDESHOW
$(function () {
  $("#slideshow > div:gt(0)").hide();
  setInterval(function () {
    $("#slideshow > div:first")
      .fadeOut(1000)
      .next()
      .fadeIn(1000)
      .end()
      .appendTo("#slideshow");
  }, 3850);
});

// CUSTOM JQUERY FUNCTION FOR SWAPPING CLASSES
(function ($) {
  "use strict";
  $.fn.swapClass = function (remove, add) {
    this.removeClass(remove).addClass(add);
    return this;
  };
})(jQuery);

// SHOW/HIDE PANEL ROUTINE (needs better methods)
// I'll optimize when time permits.
$(function () {
  $(".agree, .forgot, #toggle-terms, .log-in, .sign-up").on(
    "click",
    function (event) {
      event.preventDefault();
      var user = $(".user"),
        terms = $(".terms"),
        form = $(".form-wrap"),
        recovery = $(".recovery"),
        close = $("#toggle-terms"),
        arrow = $(".tabs-content .fa");
      if (
        $(this).hasClass("agree") ||
        $(this).hasClass("log-in") ||
        ($(this).is("#toggle-terms") && terms.hasClass("open"))
      ) {
        if (terms.hasClass("open")) {
          form.swapClass("open", "closed");
          terms.swapClass("open", "closed");
          close.swapClass("open", "closed");
        } else {
          if ($(this).hasClass("log-in")) {
            return;
          }
          form.swapClass("closed", "open");
          terms.swapClass("closed", "open").scrollTop(0);
          close.swapClass("closed", "open");
          user.addClass("overflow-hidden");
        }
      } else if (
        $(this).hasClass("forgot") ||
        $(this).hasClass("sign-up") ||
        $(this).is("#toggle-terms")
      ) {
        if (recovery.hasClass("open")) {
          form.swapClass("open", "closed");
          recovery.swapClass("open", "closed");
          close.swapClass("open", "closed");
        } else {
          if ($(this).hasClass("sign-up")) {
            return;
          }
          form.swapClass("closed", "open");
          recovery.swapClass("closed", "open");
          close.swapClass("closed", "open");
          user.addClass("overflow-hidden");
        }
      }
    }
  );
});

// DISPLAY MSSG
$(function () {
  $(".recovery .button").on("click", function (event) {
    event.preventDefault();
    $(".recovery .mssg").addClass("animate");
    setTimeout(function () {
      $(".form-wrap").swapClass("open", "closed");
      $(".recovery").swapClass("open", "closed");
      $("#toggle-terms").swapClass("open", "closed");
      $(".tabs-content .fa").swapClass("active", "inactive");
      $(".recovery .mssg").removeClass("animate");
    }, 2500);
  });
});

// DISABLE SUBMIT FOR DEMO
$(function () {
  $(".button").on("click", function (event) {
    $(this).stop();
    event.preventDefault();
    return false;
  });
});
