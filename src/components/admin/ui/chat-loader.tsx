"use client";


const ChatLoader = () => {
    return (
        <>
            {/* From Uiverse.io by Cobp */}
            <div className="container-vao ">
                <div className="input-orb" id="v.a.o." style={{ display: 'none' }}/>
                <div className="orb">
                    <div className="ball">
                        <div className="container-lines" />
                        <div className="container-rings" />
                    </div>
                    <svg style={{ pointerEvents: 'none' }}>
                        <filter id="gooey">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
                            <feColorMatrix
                                values="1 0 0 0 0
                                 1 0 0 0 
                                 0 1 0 0
                                 0 0 20 -10"
                            />
                        </filter>
                    </svg>
                </div>
            </div>
        </>
    )
}

export default ChatLoader;
