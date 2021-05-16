const TEXT = "text";
const AUDIO = "audio";
const VIDEO = "video";
const CAROUSEL = "card_carousel";

    $(document).ready(function(){
        $('.js-chat-msg').keypress(function (e) {
            var key = e.which;
            if(key == 13){
                sendMessage();
                return false;  
             }
        });
        $(document).on('click', '.js-send', () => {
            sendMessage();
        });
        $(document).on('click', '.js-chat-box-opener', () => {
            //initializeSocket();
            $('.js-chat-box-opener').toggleClass("fa-commenting fa-times")
            .toggleClass("js-chat-box-opener js-chat-box-close");
            $('.js-chat-box').slideDown();
        })
        $(document).on('click', '.js-chat-box-close', () => {
            $('.js-chat-box-close').toggleClass("fa-times fa-commenting")
            .toggleClass("js-chat-box-opener js-chat-box-close");
            $('.js-chat-box').slideUp();
        })

       
    });
    
    const sendMessage = () => {
        var msg = $('.js-chat-msg').val();
        var data = {
            "message": {
            "content": msg
            },
            "conversation": {
                "mode": false,
                "uuid": "2c94cf3a91cef51ca18e9b0990cb1b1e"
            },
            "channel_type": "web",
        };
    
        $.ajax({
            "url":
           "https://c6.avaamo.com/web_channel/channel/0bb27887-9589-45b2-bdf2-c6f5ad41ebe5/messages.json",
            "type": 'POST',
            "dataType": 'json',
            "crossDomain": true,
            "data": JSON.stringify(data),
            "headers": {
            "se-t": 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJsYXllcl9pZCI6ImYwNGUzMTM1LTYwOWMtNGQ3YS05NzJhLWRmMTFjZDU3ZGY5YyIsImFjY2Vzc190b2tlbiI6IkxzaURGd0h5OWJ1VS1JLTY1RGtGcTJEUFFVWmdDcjVvIiwiaWQiOjEyMDQ3NDEsImV4cGlyZV9hdCI6MTY0NDA1OTQ3Ni45NDI2NzYzfQ.wKfcPOr5ULsCnFLH6K8BWFMjo1sDfuVIV3FvfKet758',
            "Access-Control-Allow-Origin": '*'
            },
            "contentType": 'application/json; charset=utf-8',
            "success": function (result) {
                $('.js-msg-cont').append(`<li class="request"> ${msg} </li>`);
                let msgContHeight = $('.js-msg-cont').height();
                $(".js-chat-body").scrollTop(msgContHeight);
            },
            "error": function (error) {
                console.log("Error", error);
            }
        });
        //Clear text Box Value
        $('.js-chat-msg').val('');
    }
    
    const initializeSocket = () => {
        const socket = new WebSocket("wss://c6.avaamo.com/socket/websocket?web_channel_id=undefined&_se_t=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJsYXllcl9pZCI6ImYwNGUzMTM1LTYwOWMtNGQ3YS05NzJhLWRmMTFjZDU3ZGY5YyIsImFjY2Vzc190b2tlbiI6IkxzaURGd0h5OWJ1VS1JLTY1RGtGcTJEUFFVWmdDcjVvIiwiaWQiOjEyMDQ3NDEsImV4cGlyZV9hdCI6MTY0NDA1OTQ3Ni45NDI2NzYzfQ.wKfcPOr5ULsCnFLH6K8BWFMjo1sDfuVIV3FvfKet758&vsn=1.0.0");
        var joinRef = 1;
        var joinPayload = {
            "topic": "messages.f04e3135-609c-4d7a-972a-df11cd57df9c", 
            "event": "phx_join",
            "payload": {},
            "ref": joinRef++
        }
        // join channel
        socket.onopen = (res) => {
            socket.send(JSON.stringify(joinPayload), function(error) { 
                    console.log("error", error)
            });
        }

        // On Response
        socket.addEventListener('message', function (event) {
            console.log('Data',event.data);
            const data = JSON.parse(event.data);
            const trimmedData = data?.payload?.pn_native?.message;
            const msgType = data?.payload?.pn_native?.message?.content_type;
            switch(msgType){
                case TEXT:
                    chatBox.insertText(trimmedData);
                    break;
                case AUDIO:
                    chatBox.insertMultiMedia(trimmedData);
                    break;
                case VIDEO:
                    chatBox.insertMultiMedia(trimmedData);
                    break;
                case CAROUSEL:
                    chatBox.insertCarousel(trimmedData);
                    break;
                default:
                    console.log("No matching content found");
            }
            let msgContHeight = $('.js-msg-cont').height();
            $(".js-chat-body").scrollTop(msgContHeight);
        });

        $(window).on('beforeunload', function (){
            console.log("Close")
            socket.close();
        });
        
    }
    
    initializeSocket();

    const chatBox = (() => {
        const chatContainer = $('.js-msg-cont');
        let carouselCount = 0;
        let chatBox
        return chatBox = {
            insertText : (data) => {
                const msg = data.content;
                chatContainer.append(`<li class="response text"> ${msg} </li>`);
            },
            insertMultiMedia: (data) => {
                const url = data?.attachments?.files[0].url;
                const multiMediaType = data?.content_type;
                let multiMediaData;
                if(multiMediaType === AUDIO){
                    multiMediaData = chatBox.build.audio(url);
                }else if(multiMediaType === VIDEO){
                    multiMediaData = chatBox.build.video(url);
                }
                chatContainer.append(`<li class="response"> ${multiMediaData} </li>`);
            },
            insertCarousel: (data) => {
                ++carouselCount;
                const carouselId = `carousel${carouselCount}`
                const cards = [...data?.attachments?.card_carousel?.cards];
                let carousel = chatBox.build.cards(cards);
                carousel = carousel.join('');
                chatContainer
                .append(`
                <li id="${carouselId}" class="response carousel">
                    <button id="btn-left" class="btn-left"> < </button>
                    <button id="btn-right" class="btn-right"> > </button>
                    <div class="carousel-wrap js-carousel-wrap"> 
                        ${carousel}
                    </div>
                </li>`);
                chatBox.initiateCarousel(`#${carouselId}`);
            },
            initiateCarousel: (carouselId) => {
                let carousel = $(`${carouselId} .js-carousel-wrap`);
                const cardsCount = $(`${carouselId} .js-carousel-wrap>div.card`).length;
                const btnRight = $(`${carouselId} #btn-right`);
                const btnLeft = $(`${carouselId} #btn-left`);
                $(carousel).css("width", (cardsCount * 100) + "%");
                let cardPosition = 0;
                $(document).on('click',`${carouselId} .btn-right`, function(){
                    $(btnLeft).show();
                    ++cardPosition;
                    let margin = cardPosition * (-100);
                    $(carousel).css("marginLeft" , margin+"%");
                    if( (cardPosition + 1) === cardsCount){
                        $(btnRight).hide();
                    }
                });
                $(document).on('click',`${carouselId} .btn-left`, function(){
                    $(btnRight).show();
                    --cardPosition;
                    let margin = cardPosition * (-100);
                    $(carousel).css("marginLeft" , margin+"%");
                    if(cardPosition === 0){
                        $(btnLeft).hide();
                    }
                });
            },
            build: {
                audio: (url) => {
                    return(
                        `<audio controls>
                        <source src="${url}" type="audio/mpeg">
                            Your browser does not support the audio element.
                        </audio>`
                    )
                },
                video: (url) => {
                    return(
                        `<video width="400" controls>
                        <source src="${url}" type="video/mp4">
                            Your browser does not support HTML video.
                        </video>`
                    )
                },
                cards: (data) => {
                    const cardWidth = `${(100 - data.length)/data.length}%`;
                    return data.map( (card) => {           
                        let {title, showcase_image_url, description, links} = card;
                        title = (title)? `<h3>${title}</h3>` : '';
                        showcase_image_url = (showcase_image_url)? `<img src="${showcase_image_url}" />` : '';
                        description = (description)? `<p>${description}</p>` : '';
                        links = (links[0].title)? `<a href="${links[0].url}">${links[0].title}</a>` : '';
                        return(
                            `<div class="card" style="width:${cardWidth}">
                                ${title}
                                ${showcase_image_url}
                                ${description}
                                ${links}
                            </div>`
                        )
                    })
                }
            }
        }
    
    })();